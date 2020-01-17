import { Component, Input } from '@angular/core'
import { ValueSpecString, ValueSpecNumber } from 'src/app/models/app-model'
import { Range } from 'src/app/util/config.util'
import { AlertController, ModalController } from '@ionic/angular'
import * as configUtil from '../../util/config.util'

@Component({
  selector: 'app-config-value',
  templateUrl: 'app-config-value.page.html',
  styleUrls: ['app-config-value.page.scss'],
})
export class AppConfigValuePage {
  @Input() spec: ValueSpecString | ValueSpecNumber
  @Input() value: string
  inputValue: string
  error = ''
  edited = false
  rangeDescription: string

  constructor (
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    if (this.spec.type === 'number') {
      const range = configUtil.Range.from(this.spec.range)
      this.rangeDescription = ''
    }
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
    await this.modalCtrl.dismiss({
      edited: this.edited,
      value: this.spec.type === 'number' ? Number(this.value) : this.value,
    })
  }

  handleInput (value: string) {
    // test blank
    if (!value && this.edited) {
      this.error = 'Value cannot be blank'
      return
    }

    this.edited = true

    // test pattern if string
    if (this.spec.type === 'string') {
      const pattern = this.spec.pattern
      if (pattern && !RegExp(pattern.regex).test(value)) {
        this.error = pattern.description
      } else {
        this.error = ''
      }
    }
    // test range if number
    if (this.spec.type === 'number') {
      const range = Range.from(this.spec.range)
      if (!RegExp('^[0-9]+$').test(this.value)) {
        this.error = 'Value must be a number'
      } else {
        try {
          range.checkIncludes(Number(this.value))
          this.error = ''
        } catch (e) {
          this.error = e.message
        }
      }
    }
  }

  async presentAlertUnsaved () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      buttons: [
        {
          text: `Leave`,
          cssClass: 'alert-danger',
          handler: () => {
            this.modalCtrl.dismiss({
              edited: false,
            })
          },
        },
        {
          text: 'Stay Here',
          role: 'cancel',
        },
      ],
    })
    await alert.present()
  }
}

