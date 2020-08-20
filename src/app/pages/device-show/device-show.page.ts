import { Component } from '@angular/core'
import { ToastController, AlertController, NavController, ActionSheetController } from '@ionic/angular'
import { AppState, Device } from '../../app-state'
import { ActivatedRoute } from '@angular/router'
import { CertInstaller } from 'capacitor-cert-installer'

import { Plugins } from '@capacitor/core'
import { pauseFor } from '../register/register.page'
const { Clipboard } = Plugins

@Component({
  selector: 'device-show',
  templateUrl: './device-show.page.html',
  styleUrls: ['./device-show.page.scss'],
})
export class DeviceShowPage {
  device: Device

  constructor (
    private readonly navCtrl: NavController,
    private readonly appState: AppState,
    private readonly route: ActivatedRoute,
    private readonly toastCtrl: ToastController,
    private readonly actionSheetCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit ( ) {
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.device = this.appState.peekDevices().find(d => d.productKey === productKey)
  }

  ionViewDidEnter () {
    if (this.route.snapshot.queryParamMap.get('fresh')) {
      pauseFor(500).then(() => this.presentAlertSuccess())
    }
  }

  async presentAlertSuccess (): Promise<void> {
    let message = `Your ${this.device.type} is now privately hosted on the Internet!<br /><br />View and manage your ${this.device.type} by`
    const torMessage = ' visiting its ".onion" URL from any Tor-enabled browser.'
    if (this.device.lanAddress && this.device.cert) {
      message = message + `:<ol><li>${torMessage}</li><li>installing the SSL certificate to your phone or computer and visiting its ".local" address from any browser.</li></ol>`
    } else {
      message = message + torMessage + '<br />'
    }
    message = message + `<br />For help, check the Embassy documentation online or contact support.`

    const alert = await this.alertCtrl.create({
      header: 'Success!',
      message,
      buttons: ['OK'],
      cssClass: 'alert-success',
    })
    await alert.present()
  }

  async copyToClipboard (string: string): Promise<void> {
    const message = await Clipboard.write({ string })
      .then(() => 'Copied to clipboard!')
      .catch(() => 'failed to copy')

    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      duration: 1000,
    })
    toast.present()
  }

  async presentActionCert () {
    const alert = await this.actionSheetCtrl.create({
      buttons: [
        {
          icon: 'copy-outline',
          text: 'Copy to clipboard',
          handler: () => {
            this.copyToClipboard(this.device.cert.cert)
          },
        },
        {
          icon: 'save-outline',
          text: 'Save to device',
          handler: () => {
            this.installCert()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: `Remove ${this.device.type} from Setup App?<br /><br />This action will have no affect on the ${this.device.type} itself.<br /><br />You can re-add this ${this.device.type} later using its Product Key.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove',
          cssClass: 'alert-danger',
          handler: () => {
            this.remove()
          },
        },
      ],
    })
    await alert.present()
  }

  private async remove (): Promise<void> {
    await this.appState.removeDevice(this.device.productKey)
    if (this.appState.peekDevices().length) {
      await this.navCtrl.navigateRoot(['/devices'])
    } else {
      await this.navCtrl.navigateRoot(['/connect'])
    }
  }

  private async installCert (): Promise<void> {
    return CertInstaller.installCert({ value: this.device.cert.cert, name: this.device.cert.name })
  }
}
