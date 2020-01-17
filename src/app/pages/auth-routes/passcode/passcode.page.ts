import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { AlertController } from '@ionic/angular'

@Component({
  selector: 'passcode',
  templateUrl: 'passcode.page.html',
  styleUrls: ['passcode.page.scss'],
})
export class PasscodePage {
  passcode = ''
  passcodeEnabled: boolean

  constructor (
    readonly authService: AuthService,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    this.passcodeEnabled = this.authService.passcodeEnabled
  }

  async togglePasscode () {
    if (this.passcodeEnabled) {
      await this.presentAlertSetPasscode()
    } else {
      await this.save('')
    }
  }

  async presentAlertSetPasscode () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: this.authService.passcodeEnabled ? 'Change Passcode' : 'Set Passcode',
      inputs: [
        {
          name: 'inputValue',
          type: 'tel',
          placeholder: 'enter passcode',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            this.passcodeEnabled = this.authService.passcodeEnabled
          },
        },
        {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const value = data.inputValue

            if (!RegExp('^[0-9]{4}$').test(value)) {
              alert.message = 'Passcode must be a 4-digit number'
              return false
            }
            this.save(value)
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async save (value: string): Promise<void> {
    await this.authService.changePasscode(value)
    this.passcodeEnabled = this.authService.passcodeEnabled
  }
}

