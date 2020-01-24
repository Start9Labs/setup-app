import { Component, Input } from '@angular/core'
import { AlertController, ModalController } from '@ionic/angular'

@Component({
  selector: 'value-input',
  templateUrl: 'value-input.page.html',
  styleUrls: ['value-input.page.scss'],
})
export class ValueInputPage {
  @Input() name: string
  @Input() warning: string
  @Input() description: string
  @Input() value: string
  @Input() placeholder: string
  @Input() pattern: { regex: RegExp, description: string }
  inputValue: string
  error = ''
  edited = false

  constructor (
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    this.inputValue = this.value ? String(this.value) : ''
  }

  async dismiss () {
    if (this.edited) {
      await this.presentAlertUnsaved()
    } else {
      await this.modalCtrl.dismiss({
        edited: false,
      })
    }
  }

  async done () {
    if (this.error) { return }

    await this.modalCtrl.dismiss({
      value: this.inputValue,
    })
  }

  handleInput () {
    this.edited = true

    // test pattern if string
    const pattern = this.pattern
    if (pattern && !RegExp(pattern.regex).test(this.inputValue)) {
      this.error = pattern.description
    } else {
      this.error = ''
    }
  }

  async presentAlertUnsaved () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      buttons: [
        {
          text: 'Stay Here',
          role: 'cancel',
        },
        {
          text: `Leave`,
          cssClass: 'alert-danger',
          handler: () => {
            this.modalCtrl.dismiss({
              edited: false,
            })
          },
        },
      ],
    })
    await alert.present()
  }
}

