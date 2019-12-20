import { Component, Input } from '@angular/core'
import { ModalController, AlertController } from '@ionic/angular'
import { ValueSpec, ValueSpecList, ValueSpecString, ValueSpecObject, ListValueSpecObject } from 'src/app/models/s9-app'
import * as configUtil from '../../../../util/config.util'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() keyval: { key: string, value: ValueSpec }
  @Input() value: any[] | object
  min: number
  max: number
  edited = false

  constructor (
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    if (this.keyval.value.type === 'list') {
      const [min, max] = this.keyval.value.length.split('..').map(Number)
      this.min = min
      this.max = max
    }
  }

  async dismiss () {
    const spec = this.keyval.value
    const listLength = (this.value as string[]).length
    // if enum list, enforce limits
    if (spec.type === 'list' && spec.spec.type === 'enum') {
      if (listLength < this.min) {
        return this.presentAlertMinReached()
      } else if (listLength > this.max) {
        return this.presentAlertMaxReached()
      }
    }

    this.modalCtrl.dismiss({
      edited: this.edited,
      value: this.value,
    })
  }

  async presentModalConfig (keyval: { key: string, value: ListValueSpecObject }) {
    const modal = await this.modalCtrl.create({
      component: AppConfigNestedPage,
      componentProps: {
        keyval,
        value: this.value[keyval.key],
      },
    })

    modal.onWillDismiss().then(res => {
      this.edited = this.edited || res.data.edited
      this.value[keyval.key] = res.data.value
    })

    await modal.present()
  }

  async addEntry () {
    if (this.max && (this.value as any[]).length >= this.max) {
      await this.presentAlertMaxReached()
    } else {
      // if string list show new string alert
      if ((this.keyval.value as ValueSpecList).spec.type === 'string') {
        await this.presentAlertStringCreate()
      // if object list show new object alert
      } else {
        await this.presentAlertObjectCreate()
      }
    }
  }

  async deleteEntry (index: number) {
    if (this.min && (this.value as any[]).length <= this.min) {
      await this.presentAlertMinReached()
    } else {
      await this.presentAlertDelete(index)
    }
  }

  async handleEnumChange (option: string) {
    const index = (this.value as string[]).indexOf(option)
    const length = (this.value as string[]).length

    // if present, delete
    if (index > -1) {
      (this.value as string[]).splice(index, 1)
      this.markEdited()
    // if not present, add
    } else {
      (this.value as string[]).push(option)
      this.markEdited()
    }
  }

  async presentAlertConfigValueEdit (index: number) {
    const alert = await this.alertCtrl.create({
      header: this.keyval.key,
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          value: this.value[index],
          placeholder: 'Enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const inputValue = data.inputValue
            // return if no change
            if (this.value[index] === inputValue) { return }
            // otherwise add/update value and mark edited
            try {
              this.validate(inputValue)
              this.markEdited();
              (this.value as any[]).splice(index, 1, inputValue)
            } catch (e) {
              alert.message = e.message
              return false
            }
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertStringCreate () {
    const alert = await this.alertCtrl.create({
      header: this.keyval.key,
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          placeholder: 'Enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const inputValue = data.inputValue
            // return if no value
            if (!inputValue) { return }
            // add value and mark edited
            try {
              this.validate(inputValue)
              this.markEdited();
              (this.value as any[]).push(inputValue)
            } catch (e) {
              alert.message = e.message
              return false
            }
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertObjectCreate () {
    const objectSpec = (this.keyval.value as ValueSpecList).spec as ValueSpecObject
    const alert = await this.alertCtrl.create({
      header: `Create ${this.keyval.key}?`,
      message: `${this.keyval.key} has multiple fields. You will be able to make edits before saving.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Create',
          handler: () => {
            (this.value as object[]).push(configUtil.mapSpecToConfigObject(objectSpec))
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertMinReached () {
    const alert = await this.alertCtrl.create({
      header: 'Minimum Reached',
      message: `The minimum number of ${this.keyval.key} is ${this.min}.`,
      buttons: ['Ok'],
    })
    await alert.present()
  }

  async presentAlertMaxReached () {
    const alert = await this.alertCtrl.create({
      header: 'Limit Reached',
      message: `The maximum number of ${this.keyval.key} is ${this.max}.`,
      buttons: ['Ok'],
    })
    await alert.present()
  }

  async presentAlertDelete (index: number) {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to delete this entry?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          cssClass: 'alert-danger',
          handler: async () => {
            this.markEdited();
            (this.value as any[]).splice(index, 1)
          },
        },
      ],
    })
    await alert.present()
  }

  validate (value: string) {
    // test blank
    if (!value) {
      throw new Error('cannot be blank')
    }
    // test pattern
    const pattern = ((this.keyval.value as ValueSpecList).spec as ValueSpecString).pattern
    if (pattern && !RegExp(pattern.regex).test(value)) {
      throw new Error(pattern.description)
    }
  }

  markEdited () {
    this.edited = true
  }
}
