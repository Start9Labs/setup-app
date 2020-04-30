import { Component, Input } from '@angular/core'
import { ModalController, AlertController } from '@ionic/angular'
import { ValueSpec, ValueSpecList, ValueSpecObject, ListValueSpecObject } from 'src/app/models/app-model'
import * as configUtil from '../../util/config.util'
import { AppConfigValuePage } from '../app-config-value/app-config-value.page'

@Component({
  selector: 'app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() keyval: { key: string, value: ValueSpec }
  @Input() value: any[] | object | null
  min: number | undefined
  max: number | undefined
  edited = false

  constructor (
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    if (this.keyval.value.type === 'list') {
      const range = configUtil.Range.from(this.keyval.value.range)
      this.min = range.integralMin()
      this.max = range.integralMax()
    }
  }

  async dismiss (nullify = false) {
    const spec = this.keyval.value
    const listLength = (this.value as string[]).length
    // if enum list, enforce limits
    if (spec.type === 'list' && spec.spec.type === 'enum') {
      if (this.min && listLength < this.min) {
        return this.presentAlertMinReached()
      } else if (this.max && listLength > this.max) {
        return this.presentAlertMaxReached()
      }
    }

    this.modalCtrl.dismiss({
      edited: this.edited,
      value: nullify ? null : this.value,
    })
  }

  async presentModalConfig (i: number, spec: ListValueSpecObject) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AppConfigNestedPage,
      presentingElement: await this.modalCtrl.getTop(),
      componentProps: {
        keyval: {
          key: `${this.keyval.key} ${i + 1}`,
          value: spec,
        },
        value: (this.value as any[])[i],
      },
    })

    modal.onWillDismiss().then(res => {
      this.edited = this.edited || res.data.edited
      if (res.data.edited) {
        (this.value as any[])[i] = res.data.value
      }
    })

    await modal.present()
  }

  async addEntry () {
    if (this.max && (this.value as any[]).length >= this.max) {
      await this.presentAlertMaxReached()
    } else {
      // if string list show new string alert
      if (['string', 'number'].includes((this.keyval.value as ValueSpecList).spec.type)) {
        await this.presentModalValueEdit()
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
      await this.presentAlertDeleteEntry(index)
    }
  }

  async handleEnumChange (option: string) {
    const index = (this.value as string[]).indexOf(option)

    // if present, delete
    if (index > -1) {
      (this.value as string[]).splice(index, 1)
      this.edited = true
    // if not present, add
    } else {
      (this.value as string[]).push(option)
      this.edited = true
    }
  }

  async presentModalValueEdit (index?: number) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AppConfigValuePage,
      presentingElement: await this.modalCtrl.getTop(),
      componentProps: {
        spec: (this.keyval.value as ValueSpecList).spec,
        value: index !== undefined ? (this.value as any[])[index] : '',
      },
    })

    modal.onWillDismiss().then(res => {
      this.edited = this.edited || res.data.edited
      if (res.data.edited) {
        index !== undefined ? (this.value as any)[index] = res.data.value : (this.value as any[]).push(res.data.value)
      }
    })

    await modal.present()
  }

  async presentAlertObjectCreate () {
    const objectSpec = (this.keyval.value as ValueSpecList).spec as ValueSpecObject
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: `Create ${this.keyval.value.name}?`,
      message: `${this.keyval.value.name} has multiple fields. You will be able to make edits before saving.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Create',
          handler: () => {
            (this.value as object[]).push(configUtil.mapSpecToConfigObject(objectSpec))
            this.edited = true
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertMinReached () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Minimum Reached',
      message: `The minimum number of ${this.keyval.key} is ${this.min}.`,
      buttons: ['Ok'],
    })
    await alert.present()
  }

  async presentAlertMaxReached () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Limit Reached',
      message: `The maximum number of ${this.keyval.key} is ${this.max}.`,
      buttons: ['Ok'],
    })
    await alert.present()
  }

  async presentAlertDeleteEntry (index: number) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
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
            (this.value as any[]).splice(index, 1)
            this.edited = true
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertDestroyObject () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to delete ${this.keyval.value.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          cssClass: 'alert-danger',
          handler: async () => {
            this.destroy()
          },
        },
      ],
    })
    await alert.present()
  }

  destroy () {
    this.edited = true
    this.dismiss(true)
  }
}
