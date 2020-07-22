import { Component, NgZone } from '@angular/core'
import { LoadingController, NavController, AlertController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { getLanIP, idFromProductKey, HttpService, Method } from '../../services/http/http.service'
import { AppState, Device } from 'src/app/app-state'
import { Subscription } from 'rxjs'
import { genPrivKey, encrypt, getPubKey, onionFromPubkey, encode16 } from 'src/app/util/crypto'
import * as base32 from 'base32.js'
const b32decoder = new base32.Decoder({ type: 'rfc4648' })

@Component({
  selector: 'page-connect',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss'],
})
export class ConnectPage {
  error = ''
  productKey = ''
  host = ''
  existsSub: Subscription
  serviceExists = false
  segmentValue: 'basic' | 'advanced' = 'basic'

  constructor (
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly zone: NgZone,
    private readonly appState: AppState,
    private readonly httpService: HttpService,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    this.existsSub = this.zeroconfMonitor.watchServiceExists().subscribe(e => {
      this.zone.run(() => { this.serviceExists = e })
    })
  }

  ngOnDestroy () {
    this.existsSub.unsubscribe()
  }

  segmentChanged (): void {
    this.error = ''
  }

  async connect (ip?: string): Promise<void> {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    this.error = ''

    try {
      const identifier = idFromProductKey(this.productKey)
      ip = ip || this.getIP(identifier)
      const device = await this.finishConnect(ip, identifier)
      this.appState.addDevice(device)

      this.navCtrl.navigateRoot(['/devices', identifier], { queryParams: { success: 1, productKey: this.productKey } })
    } catch (e) {
      console.error(e)
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }

  private getIP (id: string): string {
    // get zeroconf service
    const zeroconfService = this.zeroconfMonitor.getService(id)
    if (!zeroconfService) { throw new Error('Embassy not found on local network. Please check Product Key and see "Instructions" below') }

    // get IP
    const ip = getLanIP(zeroconfService)
    if (!ip) { throw new Error('IP address not found. Please contact support.') }

    return ip
  }

  private async finishConnect (ip: string, id: string): Promise<Device> {
    const torkey = genPrivKey()

    const torkeyIndicator = new TextEncoder().encode('== ed25519v1-secret: type0 ==')
    const { cipher, counter, salt } = await encrypt(this.productKey, new Uint8Array([...torkeyIndicator, ...torkey]))

    const fullRes = await this.httpService.requestFull<string>({
      method: Method.POST,
      url: `http://${ip}:5959/v0/registerTor`,
      data: { torkey: encode16(cipher), counter: encode16(counter), salt: encode16(salt) },
    })

    const torAddress = fullRes.data
    if (fullRes.status === 209) {
      const alert = await this.alertCtrl.create({
        cssClass: 'my-custom-class',
        header: 'Alert',
        // subHeader: 'Subtitle',
        message: 'Tor address already registered on Embassy. If this is your first time setting up your Embassy, please call support. This could be a sign of a security breach.',
        buttons: ['OK'],
      })

      await alert.present()
    } else {
      const clientComputedTorAddress = await getPubKey(torkey).then(onionFromPubkey)
      if (clientComputedTorAddress !== torAddress) throw new Error('Misalignment on tor address')
    }

    const type = 'Embassy'
    return {
      id,
      label: `${type}:${id}`,
      torAddress: torAddress,
      type,
    }
  }
}


