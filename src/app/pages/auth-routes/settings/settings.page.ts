import { Component } from '@angular/core'
import { AlertController, Platform } from '@ionic/angular'
import { AuthService } from 'src/app/services/auth.service'
import { Store } from 'src/app/store'
import { TorService } from 'src/app/services/tor.service'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  torEnabled: boolean

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly authService: AuthService,
    private readonly store: Store,
    private readonly torService: TorService,
    public platform: Platform,
  ) { }

  ngOnInit () {
    this.torEnabled = this.store.torEnabled
  }

  async handleTorChange () {
    await this.store.toggleTor(this.torEnabled)
    if (this.torEnabled) {
      this.torService.start()
    } else {
      this.torService.stop()
    }
  }

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
          handler: () => {
            this.presentAlertViewMnemonic()
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
            this.authService.logout()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertExplainTor () {
    const alert = await this.alertCtrl.create({
      header: 'Tor',
      message: 'Enabling Tor allows you to connect privately and securely with your Embassies outside your home network',
      buttons: ['OK'],
    })
    await alert.present()
  }
}
