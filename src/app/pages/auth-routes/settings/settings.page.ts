import { Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly authService: AuthService,
  ) { }

  async presentAlertLogout () {
    const alert = await this.alertCtrl.create({
      header: 'Caution!',
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
}
