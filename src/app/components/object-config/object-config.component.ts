import { Component, Input, Output, EventEmitter } from '@angular/core'
import { AppConfigSpec, ValueSpec, ValueSpecString, ValueSpecObject } from 'src/app/models/app-model'
import { ModalController, AlertController } from '@ionic/angular'
import { AppConfigNestedPage } from 'src/app/modals/app-config-nested/app-config-nested.page'
import * as configUtil from '../../util/config.util'
import { AppConfigValuePage } from 'src/app/modals/app-config-value/app-config-value.page'

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

  async presentModalValueEdit (keyval: { key: string, value: ValueSpecString }) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AppConfigValuePage,
      componentProps: {
        spec: keyval.value,
        value: this.config[keyval.key],
      },
    })

    modal.onWillDismiss().then(res => {
      this.editedChange.emit(this.edited || res.data.edited)
      if (res.data.edited) {
        this.config[keyval.key] = res.data.value
      }
    })

    await modal.present()
  }

  async presentModalConfigNested (keyval: { key: string, value: ValueSpec }) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
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
