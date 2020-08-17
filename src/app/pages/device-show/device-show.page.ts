import { Component } from '@angular/core'
import { ToastController, AlertController, NavController } from '@ionic/angular'
import { AppState, Device } from '../../app-state'
import { ActivatedRoute } from '@angular/router'
// import { CertInstaller } from 'capacitor-cert-installer'

import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins

@Component({
  selector: 'device-show',
  templateUrl: './device-show.page.html',
  styleUrls: ['./device-show.page.scss'],
})
export class DeviceShowPage {
  // private readonly CertName = 'Embassy Local CA'
  device: Device

  constructor (
    private readonly navCtrl: NavController,
    private readonly appState: AppState,
    private readonly route: ActivatedRoute,
    private readonly toastCtrl: ToastController,
    // private readonly actionSheetCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit ( ) {
    const id = this.route.snapshot.paramMap.get('id')
    this.device = this.appState.peekDevices().find(d => d.id === id)
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

  // async presentActionCert () {
  //   const alert = await this.actionSheetCtrl.create({
  //     buttons: [
  //       {
  //         icon: 'copy-outline',
  //         text: 'Copy to clipboard',
  //         handler: () => {
  //           this.copyToClipboard(this.device.cert)
  //         },
  //       },
  //       {
  //         icon: 'save-outline',
  //         text: 'Save to device',
  //         handler: () => {
  //           this.installCert()
  //         },
  //       },
  //     ],
  //   })
  //   await alert.present()
  // }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: 'Remove Embassy contact information from this device? This action will have no affect on the Embassy itself.',
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
    await this.appState.removeDevice(this.device.id)
    if (this.appState.peekDevices().length) {
      await this.navCtrl.navigateRoot(['/devices'])
    } else {
      await this.navCtrl.navigateRoot(['/connect'])
    }
  }

  // private async installCert (): Promise<void> {
  //   return CertInstaller.installCert({ value: this.device.cert, name: this.CertName })
  // }
}
