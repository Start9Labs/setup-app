import { Component, NgZone } from '@angular/core'
import { LoadingController, NavController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { getLanIP, idFromProductKey, HttpService, Method } from '../../services/http.service'
import { AppState, Device } from 'src/app/app-state'
import { Subscription } from 'rxjs'
import { genPrivKey, encrypt, getPubKey, onionFromPubkey, hmac256 } from 'src/app/util/crypto'

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
      const identifier = idFromProductKey(this.productKey)
      ip = ip || this.getIP(identifier)
      const device = await this.finishConnect(ip, identifier)
      this.appState.addDevice(device)

      const expiration = modulateTime(new Date(), 5, 'minutes')
      const hmac = await hmac256(this.productKey, expiration.toISOString())

      this.navCtrl.navigateRoot(['/devices', identifier], { queryParams: { success: 1, hmac } })
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
    // return mockDevice(id)

    const torkey = genPrivKey()
    const torkeyIndicator = new TextEncoder().encode('torkey:')
    const encrypted = encrypt(this.productKey, new Uint8Array([...torkeyIndicator, ...torkey]))

    const serverComputedTorAddress = await this.httpService.request({
      method: Method.POST,
      url: `http://${ip}:5959/v0/registerTor`,
      data: { torkey: encrypted },
    })
    const clientComputedTorAddress = await getPubKey(torkey).then(onionFromPubkey)

    if (clientComputedTorAddress !== serverComputedTorAddress) throw new Error('Misalignment on tor address')

    const type = 'Embassy'
    return {
      id,
      label: `${type}:${id}`,
      torAddress: serverComputedTorAddress,
      type,
    }
  }
}

function modulateTime (ts: Date, count: number, unit: 'days' | 'hours' | 'minutes' | 'seconds' ) {
  const ms = inMs(count, unit)
  const toReturn = new Date(ts)
  toReturn.setMilliseconds( toReturn.getMilliseconds() + ms)
  return toReturn
}

function inMs ( count: number, unit: 'days' | 'hours' | 'minutes' | 'seconds' ) {
  switch (unit){
    case 'seconds' : return count * 1000
    case 'minutes' : return inMs(count * 60, 'seconds')
    case 'hours' : return inMs(count * 60, 'minutes')
    case 'days' : return inMs(count * 24, 'hours')
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
