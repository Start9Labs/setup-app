import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { ModalController, LoadingController, AlertController } from '@ionic/angular'

@Component({
  selector: 'authenticate',
  templateUrl: 'authenticate.page.html',
  styleUrls: ['authenticate.page.scss'],
})
export class AuthenticatePage {
  error = ''
  pin = ''

  constructor (
    private readonly authService: AuthService,
    private readonly modalCtrl: ModalController,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
  ) { }

  async handleInput () {
    if (this.pin.length > 4) {
      this.error = 'Pin should be 4 digits'
    }
    if (this.pin.length === 4) {
      const loader = await this.loadingCtrl.create({
        spinner: 'lines',
        cssClass: 'loader',
      })
      await loader.present()

      try {
        await this.authService.authenticate(this.pin)
        await this.modalCtrl.dismiss()
      } catch (e) {
        this.pin = ''
        this.error = e.message
      } finally {
        await loader.dismiss()
      }
    }
  }

  async presentAlertWipeKeychain () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Wait!',
      message: 'Are you sure you want to wipe the keychain on this device? All Embassies will be forgotten. You will need your mnemonic seed to regain access to your Embassies.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Wipe Keychain',
          cssClass: 'alert-danger',
          handler: () => {
            this.logout()
          },
        },
      ],
    })
    await alert.present()
  }

  async logout () {
    await this.authService.logout()
    await this.modalCtrl.dismiss()
  }
}

