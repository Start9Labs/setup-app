import { Component } from '@angular/core'
import { LoadingController, NavController, AlertController } from '@ionic/angular'
import { getLanIP, idFromProductKey, HttpService, Method, HostsResponse, isAlreadyClaimed } from '../../services/http/http.service'
import { encode16, HMAC } from 'src/app/util/crypto'
import { ZeroconfMonitor } from 'src/app/services/zeroconf/zeroconf.service'
import { ProcessResService } from 'src/app/services/process-res.service'

@Component({
  selector: 'connect',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss'],
})
export class ConnectPage {
  error = ''
  productKey = ''
  host = ''
  segmentValue: 'basic' | 'advanced' = 'basic'

  constructor (
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly httpService: HttpService,
    private readonly alertCtrl: AlertController,
    private readonly processRes: ProcessResService,
  ) { }

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

      loader.dismiss()

      if (isAlreadyClaimed(data)) {
        if (await this.processRes.processRes(this.productKey, data)) {
          return this.presentAlertAlreadyRegistered()
        }
      } else {
        this.navCtrl.navigateForward(['/register'], {
          queryParams: { ip, productKey: this.productKey },
        })
      }
    } catch (e) {
      console.error(e)
      this.error = e.message
      loader.dismiss()
    }
  }

  private getIP (id: string): string {
    // get zeroconf service
    const zeroconfService = this.zeroconfMonitor.getService(id)
    if (!zeroconfService) { throw new Error('Embassy not found on local network. Please check Product Key and ensure you phone is connected to WiFi.') }

    // get IP
    const ip = getLanIP(zeroconfService)
    if (!ip) { throw new Error('IP address not found. Please contact support.') }

    return ip
  }

  private async presentAlertAlreadyRegistered () {
    const alert = await this.alertCtrl.create({
      header: 'Warning',
      message: 'Embassy is already setup. If you have never set up this Embassy, it means the device may be compromised, and you should contact support.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.navCtrl.navigateRoot(['/devices', this.productKey, 'success'])
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
