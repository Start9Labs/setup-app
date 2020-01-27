import { Component, Input } from '@angular/core'
import { ValueSpecString, ValueSpecNumber, ValueSpec } from 'src/app/models/app-model'
import { Range } from 'src/app/util/config.util'
import { AlertController, ModalController } from '@ionic/angular'
import { getDefaultDescription, getDefaultConfigValue } from '../../util/config.util'

@Component({
  selector: 'app-config-value',
  templateUrl: 'app-config-value.page.html',
  styleUrls: ['app-config-value.page.scss'],
})
export class AppConfigValuePage {
  @Input() spec: ValueSpecString | ValueSpecNumber
  @Input() value: string | number | null
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
    if (!this.validate) { return }

    const toReturn = this.inputValue || null

    await this.modalCtrl.dismiss({
      edited: this.edited,
      value: this.spec.type === 'number' && toReturn ? Number(toReturn) : toReturn,
    })
  }

  getDefaultDescription (spec: ValueSpec): string | undefined {
    return getDefaultDescription(spec)
  }

  refreshDefault () {
    this.inputValue = String(getDefaultConfigValue(this.spec))
    this.handleInput()
  }

  handleInput () {
    this.error = ''
    this.edited = true
  }

  validate (): boolean {
    // test blank
    if (!this.inputValue && !this.spec.nullable) {
      this.error = 'Value cannot be blank'
      return false
    }
    // test pattern if string
    if (this.spec.type === 'string' && this.inputValue) {
      const { pattern, patternDescription } = this.spec
      if (pattern && !RegExp(pattern).test(this.inputValue)) {
        this.error = patternDescription || ''
        return false
      }
    }
    // test range if number
    if (this.spec.type === 'number' && this.inputValue) {
      const range = Range.from(this.spec.range)
      if (this.spec.integral && !RegExp('^[-+]?[0-9]+$').test(this.inputValue)) {
        this.error = 'Value must be an integer'
        return false
      } else if (!this.spec.integral && !RegExp('^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$').test(this.inputValue)) {
        this.error = 'Value must be a number'
        return false
      } else {
        try {
          range.checkIncludes(Number(this.inputValue))
        } catch (e) {
          this.error = e.message
          return false
        }
      }
    }
    this.error = ''
    return true
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

  clear () {
    this.edited = true
    this.inputValue = ''
  }
}

