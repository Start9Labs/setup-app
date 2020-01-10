import { Component } from '@angular/core'
import { AlertController, Platform, ActionSheetController } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {

  constructor (
    readonly platform: Platform,
    private readonly alertCtrl: AlertController,
    private readonly authService: AuthService,
    private readonly actionSheetCtrl: ActionSheetController,
  ) { }

  async goToInstructions () {
    return true
  }

  async goToFAQ () {
    return true
  }

  async presentAlertWarnRecovery () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: 'Please make sure no one is snooping. And remember to keep your recovery phrase private and secure.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Show',
          cssClass: 'alert-danger',
          handler: async () => {
            await this.presentAlertViewRecovery()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertViewRecovery () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Recovery Phrase',
      message: `${this.authService.mnemonic!.join(' ')}`,
      buttons: ['Close'],
    })
    await alert.present()
  }

  async presentAlertWipeKeychain () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Wait!',
      message: 'Are you sure you want to wipe the keychain on this device? All servers will be forgotten. You will need your recovery phrase to regain access to your servers.',
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

  async presentActionContact () {
    const phone = '+17207440490'
    const email = 'support@start9labs.com'

    const actionSheet = await this.actionSheetCtrl.create({
      buttons: [
        {
          text: 'Call',
          icon: 'call',
          handler: () => {
            window.open('tel:' + phone, '_system')
          },
        },
        {
          text: 'Email',
          icon: 'mail',
          handler: () => {
            window.open('mailto:' + email + '?&subject=General Inquiry', '_system')
          },
        },
      ],
    })
    await actionSheet.present()
  }

  rateApp () {
    if (this.platform.is('ios')) {
      window.open('https://apps.apple.com/us/app/start9-companion.12345678', '_system')
    } else if (this.platform.is('android')) {
      window.open('market://details?id=com.start9-companion.android.app', '_system')
    }
  }
}
