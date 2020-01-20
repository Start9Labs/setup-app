import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { AlertController } from '@ionic/angular'

@Component({
  selector: 'pin',
  templateUrl: 'pin.page.html',
  styleUrls: ['pin.page.scss'],
})
export class PinPage {
  pin = ''
  pinEnabled: boolean

  constructor (
    readonly authService: AuthService,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    this.pinEnabled = this.authService.pinEnabled
  }

  async togglePin () {
    if (this.pinEnabled) {
      await this.presentAlertSetPin()
    } else {
      await this.save('')
    }
  }

  async presentAlertSetPin () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: this.authService.pinEnabled ? 'Change Pin' : 'Set Pin',
      inputs: [
        {
          name: 'inputValue',
          type: 'tel',
          id: 'maxLength4',
          placeholder: 'Enter new pin',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            this.pinEnabled = this.authService.pinEnabled
          },
        },
        {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const value = data.inputValue

            if (!RegExp('^[0-9]{4}$').test(value)) {
              alert.message = 'Pin must be a 4-digit number'
              return false
            }
            this.save(value)
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present().then(() => { document.getElementById('maxLength4')!.setAttribute('maxlength', '4') })
  }

  async save (value: string): Promise<void> {
    await this.authService.changePin(value)
    this.pinEnabled = this.authService.pinEnabled
  }
}

