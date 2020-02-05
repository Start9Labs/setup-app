import { Component } from '@angular/core'
import { AlertController, Platform } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {

  constructor (
    private readonly platform: Platform,
    private readonly alertCtrl: AlertController,
    private readonly authService: AuthService,
  ) { }

  async presentAlertWarnMnemonic () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: 'Please make sure no one is snooping. And remember to keep your mnemonic seed private and secure.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Show',
          cssClass: 'alert-danger',
          handler: async () => {
            await this.presentAlertViewMnemonic()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertViewMnemonic () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Mnemonic Seed',
      message: `${this.authService.mnemonic!.join(' ')}`,
      buttons: ['Close'],
    })
    await alert.present()
  }

  async presentAlertWipeKeychain () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Wait!',
      message: 'Are you sure you want to wipe the keychain on this device? All servers will be forgotten. You will need your mnemonic seed to regain access to your servers.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Wipe Keychain',
          cssClass: 'alert-danger',
          handler: async () => {
            await this.authService.logout()
          },
        },
      ],
    })
    await alert.present()
  }

  openEmail () {
    window.open('mailto:support@start9labs.com', '_system')
  }

  rateApp () {
    if (this.platform.is('ios')) {
      window.open('https://apps.apple.com/app/start9-companion-app/id1496204174', '_system')
    } else if (this.platform.is('android')) {
      window.open('market://details?id=com.start9labs.start9companion', '_system')
    }
  }
}
