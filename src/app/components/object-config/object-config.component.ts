import { Component, Input, Output, EventEmitter } from '@angular/core'
import { AppConfigSpec, ValueSpec, ValueSpecString, ValueSpecObject } from 'src/app/models/s9-app'
import { ModalController, AlertController } from '@ionic/angular'
import { AppConfigNestedPage } from 'src/app/pages/auth-routes/server-routes/apps-routes/app-config-nested/app-config-nested.page'
import * as configUtil from '../../util/config.util'

@Component({
  selector: 'object-config',
  templateUrl: './object-config.component.html',
  styleUrls: ['./object-config.component.scss'],
})
export class ObjectConfigComponent {
  @Input() spec: AppConfigSpec
  @Input() config: object
  @Input() edited: boolean
  @Output() editedChange = new EventEmitter<boolean>()

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly modalCtrl: ModalController,
  ) { }

  async presentDescription (keyval: { key: string, value: ValueSpec }, e: Event) {
    e.stopPropagation()
    const alert = await this.alertCtrl.create({
      header: keyval.key,
      message: keyval.value.description,
    })
    await alert.present()
  }

  async handleObjectClick (keyval: { key: string, value: ValueSpecObject }) {
    // if object is not null, go to it
    if (this.config[keyval.key]) {
      await this.presentModalConfigNested(keyval)
    // if object is null, offer to create
    } else {
      await this.presentAlertObjectCreate(keyval)
    }
  }

  async presentAlertObjectCreate (keyval: { key: string, value: ValueSpecObject }) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: `Create ${keyval.key}?`,
      message: `${keyval.key} has multiple fields. You will be able to edit them before saving.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Create',
          handler: () => {
            this.config[keyval.key] = configUtil.mapSpecToConfigObject(keyval.value)
            this.presentModalConfigNested(keyval)
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertConfigValue (keyval: { key: string, value: ValueSpecString }) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: keyval.key,
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          value: this.config[keyval.key],
          placeholder: 'enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const inputValue = data.inputValue
            // return if no change
            if (this.config[keyval.key] === inputValue) { return }
            // set new value and mark edited
            try {
              this.validate(keyval.value, inputValue)
              this.markEdited()
              this.config[keyval.key] = inputValue
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

  async presentModalConfigNested (keyval: { key: string, value: ValueSpec }) {
    const modal = await this.modalCtrl.create({
      component: AppConfigNestedPage,
      componentProps: {
        keyval,
        value: this.config[keyval.key],
      },
    })

    modal.onWillDismiss().then(res => {
      this.editedChange.emit(this.edited || res.data.edited)
      this.config[keyval.key] = res.data.value
    })

    await modal.present()
  }

  validate (spec: ValueSpecString, value: string) {
    // test nullable
    if (!value && !spec.nullable) {
      throw new Error('cannot be blank')
    }
    // test pattern
    const pattern = spec.pattern
    if (pattern && !RegExp(pattern.regex).test(value)) {
      throw new Error(pattern.description)
    }
  }

  setSelectHeader (key: string) {
    return { header: key }
  }

  markEdited () {
    this.editedChange.emit(true)
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
