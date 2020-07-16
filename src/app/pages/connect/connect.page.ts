import { Component, NgZone } from '@angular/core'
import { LoadingController, NavController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { getLanIP, idFromProductKey, HttpService, Method } from '../../services/http.service'
import { AppState, Device } from 'src/app/app-state'
import { Subscription } from 'rxjs'
import { genPrivKey, encrypt } from 'src/app/util/window'

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
      const id = idFromProductKey(this.productKey)
      ip = ip || this.getIP(id)
      const device = await this.finishConnect(id)
      this.appState.addDevice(device)
      this.navCtrl.navigateRoot(['/devices', id], { queryParams: { success: 1 } })
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

  private async finishConnect (id: string): Promise<Device> {
    // return mockDevice(id)


    const torkey = genPrivKey()

    // const arrayBuff = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))

    const encrypted = encrypt(this.productKey, torkey)

    const torAddress = await this.httpService.request({
      method: Method.POST,
      url: `http://${ip}:5959/registerTor`,
      data: { encrypted }
    })



    // // get Ambassador version
    
    // // hmac
    // const pubKey = await this.httpService.request({
    //   method: Method.POST,
    //   url: `http://${ip}:5959/${version}/dhe`,
    //   data: { publicKey: '' },
    // })
  }
}

function mockDevice (id: string): Device {
  const type = 'Embassy'
  return {
    id,
    torAddress: 'extralongmocktoraddresstotestwrapping.onion',
    type,
    label: `${type}:${id}`,
  }
}
