import { Component, NgZone } from '@angular/core'
import { LoadingController, NavController, AlertController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { getLanIP, idFromProductKey, HttpService, Method, HostsResponse } from '../../services/http/http.service'
import { Subscription } from 'rxjs'
import { encode16, HMAC, decode16 } from 'src/app/util/crypto'
import { AppState } from 'src/app/app-state'
import { HmacService } from 'src/app/services/hmac/hmac.service'
@Component({
  selector: 'connect',
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
    private readonly httpService: HttpService,
    private readonly alertCtrl: AlertController,
    private readonly appState: AppState,
    private readonly zone: NgZone,
    private readonly hmacService: HmacService,
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

  connectWithIp () {
    if (!this.host || this.host === '') throw new Error('cannot connect without set host')
    this.connect(this.host)
  }

  async connect (ip?: string): Promise<void> {
    this.error = ''

    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const id = idFromProductKey(this.productKey)
      ip = ip || this.getIP(id)

      const expiration = modulateTime(new Date(), 5, 'minutes')
      const messagePlain = expiration.toISOString()
      const { hmac, salt } = await HMAC.sha256(this.productKey, messagePlain)

      const { data } = await this.httpService.request<HostsResponse>({
        method: Method.GET,
        url: `http://${ip}:5959/v0/hosts`,
        params: {
          hmac: encode16(hmac),
          message: messagePlain,
          salt: encode16(salt),
        },
      })

      const hmacRes = await this.hmacService.validateHmacExpiration(this.productKey, data.hmac, data.message, data.salt)
      switch (hmacRes) {
        case 'hmac-invalid': return this.presentAlertInvalidRes()
        case 'expiration-invalid': return this.presentAlertExpiredRes()
        case 'success': console.log(`Successful hmac validation`)
      }

      if (data.torAddress || data.cert) {
        this.appState.addDevice(id, data.torAddress, data.cert)
        this.presentAlertAlreadyRegistered(id)
      } else {
        this.navCtrl.navigateForward(['/register'], {
          queryParams: { ip, id, productKey: this.productKey },
        })
      }
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      loader.dismiss()
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

  private async presentAlertInvalidRes () {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: 'Unable to verify response from Embassy. It is possible you are experiencing a "Man in the Middle" attack. Please contact support.',
      buttons: ['OK'],
    })

    return alert.present()
  }

  private async presentAlertExpiredRes () {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: 'Response from embassy valid, but expired. It is possible you are experiencing a "Man in the Middle" replay attack. Please contact support.',
      buttons: ['OK'],
    })

    return alert.present()
  }

  private async presentAlertAlreadyRegistered (id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Warning',
      message: 'This Embassy has already been registered. If you did not do this, it could mean your Embassy has been compromised. Please contact support',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.navCtrl.navigateRoot(['/devices', id])
          },
        },
      ],
    })

    return alert.present()
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
