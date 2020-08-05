import { Component, NgZone } from '@angular/core'
import { LoadingController, NavController, AlertController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { getLanIP, idFromProductKey, HttpService, Method } from '../../services/http/http.service'
import { AppState, Device } from 'src/app/app-state'
import { Subscription } from 'rxjs'
import { genExtendedPrivKey, encrypt, getPubKey, onionFromPubkey, encode16, encodeObject } from 'src/app/util/crypto'
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
    // start zeroconf monitor
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
      console.log(`connect`, device)
      await this.appState.addDevice(device)

      this.navCtrl.navigateRoot(['/devices', identifier], { queryParams: { success: 1, productKey: this.productKey } })
    } catch (e) {
      console.error(e)
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }

  connectWithIp () {
    if (!this.host || this.host === '') throw new Error('cannot connect without set host')
    this.connect(this.host)
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
    const { secretKey, expandedSecretKey } = await genExtendedPrivKey()
    const { cipher, ...rest } = await this.encryptSecretKey(expandedSecretKey)

    const { data: torAddress, status } = await this.httpService.requestFull<string>({
      method: Method.POST, url: `http://${ip}:5959/v0/registerTor/`, data: { torkey: cipher, ...rest },
    })

    if (torAlreadyExists(status)) {
      await this.presentTorAlreadyExistsAlert()
    } else {
      await this.validateServerGeneratedTorAddress(secretKey, torAddress)
    }

    const type = 'Embassy'
    return { id, label: `${type}:${id}`, torAddress: torAddress, type }
  }

  private async presentTorAlreadyExistsAlert () {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: 'Alert',
      message: 'Tor address already registered on Embassy. If this is your first time setting up your Embassy, please call support. This could be a sign of a security breach.',
      buttons: ['OK'],
    })

    return alert.present()
  }

  private async validateServerGeneratedTorAddress (secretKey: Uint8Array, serverTorAddress: string): Promise<void> {
    const clientComputedTorAddress = await getPubKey(secretKey).then(onionFromPubkey)
    if (clientComputedTorAddress !== serverTorAddress) throw new Error('Misalignment on tor address')
  }

  private encryptSecretKey (expandedSecretKey: Uint8Array): Promise<{ cipher: string, counter: string, salt: string }> {
    const TOR_KEY_INDICATOR = new TextEncoder().encode('== ed25519v1-secret: type0 ==')
    return encrypt(this.productKey, new Uint8Array([...TOR_KEY_INDICATOR, 0, 0, 0, ...expandedSecretKey])).then(res =>
      encodeObject(encode16, res) as { cipher: string, counter: string, salt: string },
    )
  }
}

function torAlreadyExists (status: number): boolean {
  return status === 209
}

