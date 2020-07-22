import { Component } from '@angular/core'
import { ToastController, AlertController, NavController } from '@ionic/angular'
import { AppState, Device } from '../../app-state'
import { ActivatedRoute } from '@angular/router'

import { Plugins } from '@capacitor/core'
import { hmac256, encode16 } from 'src/app/util/crypto'
const { Clipboard } = Plugins

@Component({
  selector: 'page-device-show',
  templateUrl: './device-show.page.html',
  styleUrls: ['./device-show.page.scss'],
})
export class DeviceShowPage {
  device: Device
  success: string
  hmac: string
  message: string
  productKey?: string

  constructor (
    private readonly navCtrl: NavController,
    private readonly appState: AppState,
    private readonly route: ActivatedRoute,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit ( ) {
    const deviceId  = this.route.snapshot.paramMap.get('deviceId')
    this.success    = this.route.snapshot.queryParamMap.get('success')
    this.productKey = this.route.snapshot.queryParamMap.get('productKey')

    this.device = this.appState.peekDevices().find(d => d.id === deviceId)
  }

  async copyTor (forRedirect = false) {
    let url = forRedirect ? await this.getLink() : this.device.torAddress

    const message = await Clipboard.write({ url: url || '' })
      .then(() => 'copied to clipboard!')
      .catch(() => 'failed to copy')

    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      duration: 1000,
    })
    await toast.present()
  }

  async getLink (): Promise<string | undefined> {
    if (!this.device.torAddress) return undefined
    if (!this.productKey) return undefined

    const expiration = modulateTime(new Date(), 5, 'minutes')
    const messagePlain = expiration.toISOString()
    const { hmac, message, salt } = await hmac256(this.productKey, messagePlain)

    return this.device.torAddress + `/v0/register?hmac=${encode16(hmac)}&message=${encode16(message)}&salt=${encode16((salt))}`
  }

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: `Forget ${this.device.label} on this device? You can always add it back later using the product key`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Forget',
          cssClass: 'alert-danger',
          handler: () => {
            this.forget()
          },
        },
      ],
    })
    await alert.present()
  }

  async forget (): Promise<void> {
    await this.appState.removeDevice(this.device.id)
    await this.navCtrl.navigateRoot(['/devices'])
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
