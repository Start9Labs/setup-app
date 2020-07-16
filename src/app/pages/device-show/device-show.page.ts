import { Component } from '@angular/core'
import { ToastController, AlertController, NavController } from '@ionic/angular'
import { AppState, Device } from '../../app-state'
import { ActivatedRoute } from '@angular/router'

import { Plugins } from '@capacitor/core'
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

  constructor (
    private readonly navCtrl: NavController,
    private readonly appState: AppState,
    private readonly route: ActivatedRoute,
    private readonly toastCtrl: ToastController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit ( ) {
    const deviceId = this.route.snapshot.paramMap.get('deviceId')
    this.success = this.route.snapshot.queryParamMap.get('success')
    this.hmac = this.route.snapshot.queryParamMap.get('hmac')
    this.device = this.appState.peekDevices().find(d => d.id === deviceId)
  }

  async copyTor (forRedirect = false) {
    let url
    if (!this.device.torAddress) {
      url = ''
    } else {
      url = this.device.torAddress + (forRedirect ? `/register/${this.hmac}` : '')
    }

    let message: string
    await Clipboard.write({ url })
      .then(() => { message = 'copied to clipboard!' })
      .catch(() => { message = 'failed to copy' })

    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      duration: 1000,
    })
    await toast.present()
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
