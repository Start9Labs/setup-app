import { Component } from '@angular/core'
import { ToastController, AlertController, NavController, ActionSheetController } from '@ionic/angular'
import { Store, Device } from '../../store'
import { ActivatedRoute } from '@angular/router'
import { pauseFor } from '../../util/misc'

import { Plugins } from '@capacitor/core'
const { Clipboard, CertInstaller } = Plugins

@Component({
  selector: 'device-show',
  templateUrl: './device-show.page.html',
  styleUrls: ['./device-show.page.scss'],
})
export class DeviceShowPage {
  device: Device

  constructor (
    private readonly navCtrl: NavController,
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly toastCtrl: ToastController,
    private readonly actionSheetCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit ( ) {
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.device = this.store.peekDevices().find(d => d.productKey === productKey)
  }

  ionViewDidEnter () {
    if (this.route.snapshot.queryParamMap.get('fresh')) {
      pauseFor(400).then(() => this.presentAlertSuccess())
    }
  }

  async presentAlertSuccess (): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Success!',
      message: `Your ${this.device.type} is now privately hosted on the Internet!<br /><br />View and manage your ${this.device.type} by: <ol><li>${torMessage}</li><br /><li>${lanMessage}</li></ol>${helpMessage}`,
      buttons: ['OK'],
      cssClass: 'alert-success',
    })
    await alert.present()
  }

  async presentActionTor () {
    const alert = await this.actionSheetCtrl.create({
      buttons: [
        {
          icon: 'information-circle-outline',
          text: 'About Tor',
          handler: () => {
            this.presentAlertTor()
          },
        },
        {
          icon: 'copy-outline',
          text: 'Copy to clipboard',
          handler: () => {
            this.copyToClipboard(this.device.torAddress)
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertTor () {
    const alert = await this.alertCtrl.create({
      header: 'Tor',
      message: `View and manage your Embassy by ${torMessage}<br /><br />${helpMessage}`,
      buttons: ['Dismiss'],
    })
    await alert.present()
  }

  async presentActionLan () {
    const alert = await this.actionSheetCtrl.create({
      buttons: [
        {
          icon: 'information-circle-outline',
          text: 'About LAN',
          handler: () => {
            this.presentAlertLan()
          },
        },
        {
          icon: 'copy-outline',
          text: 'Copy to clipboard',
          handler: () => {
            this.copyToClipboard('https://' + this.device.lanAddress)
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertLan () {
    const alert = await this.alertCtrl.create({
      header: 'LAN',
      message: `View and manage your Embassy by ${lanMessage}<br /><br />${helpMessage}`,
      buttons: ['Dismiss'],
    })
    await alert.present()
  }

  async presentActionCert () {
    const alert = await this.actionSheetCtrl.create({
      buttons: [
        {
          icon: 'information-circle-outline',
          text: 'About SSL',
          handler: () => {
            this.presentAlertCert()
          },
        },
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

  async presentAlertCert () {
    const alert = await this.alertCtrl.create({
      header: 'SSL',
      message: `Save and trust your Embassy's SSL certificate on this or any other device to safely communicate with your Embassy over https without experiencing interference from your browser.<br /><br />${helpMessage}`,
      buttons: ['Dismiss'],
    })
    await alert.present()
  }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: `Remove ${this.device.type} from Setup App?<br /><br />This action will have no effect on the ${this.device.type} itself.<br /><br />You can re-add this ${this.device.type} later using its Product Key.`,
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
    await this.store.removeDevice(this.device.productKey)
    if (this.store.peekDevices().length) {
      await this.navCtrl.navigateRoot(['/devices'])
    } else {
      await this.navCtrl.navigateRoot(['/connect'])
    }
  }

  private async installCert (): Promise<void> {
    return CertInstaller.installCert({
      value: this.device.cert.cert,
      name: this.device.cert.name,
      iosInstructionLink: '',
    })
  }

  private async copyToClipboard (string: string): Promise<void> {
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
}

const torMessage = `visiting its ".onion" address from any Tor-enabled browser.`
const lanMessage = `saving its SSL certificate to your phone or computer and visiting its ".local" address from any browser. For this option, you must be connected to the same LAN as your Embassy.`
const helpMessage = `For help, visit start9labs.com/faq or contact support at support@start9labs.com.`
