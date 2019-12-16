import { Component, Input, Output, EventEmitter } from '@angular/core'
import { AppConfigSpec, AppValueSpec, AppValueSpecString, AppValueSpecObject } from 'src/app/models/s9-app'
import { ModalController, AlertController } from '@ionic/angular'
import { AppConfigNestedPage } from 'src/app/pages/auth-routes/server-routes/app-config-nested/app-config-nested.page'

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

  async presentDescription (keyval: { key: string, value: AppValueSpec }, e: Event) {
    e.stopPropagation()
    const alert = await this.alertCtrl.create({
      header: keyval.key,
      message: keyval.value.description,
    })
    await alert.present()
  }

  async presentAlertConfigValue (keyval: { key: string, value: AppValueSpecString }) {
    const alert = await this.alertCtrl.create({
      header: keyval.key,
      inputs: [
        {
          name: 'value',
          type: 'text',
          value: this.config[keyval.key],
          placeholder: 'enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Update',
          handler: (data: { value: string }) => {
            const value = data.value
            // return if no change
            if (this.config[keyval.key] === value) { return }
            // set new value and mark edited
            if (this.validate(keyval, value)) {
              this.markEdited()
              this.config[keyval.key] = value
            } else {
              alert.message = keyval.value.pattern!.description
              return false
            }
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentModalConfigNested (keyval: { key: string, value: AppValueSpec }) {
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

  validate (keyval: { key: string, value: AppValueSpecString }, value: string) {
    const pattern = keyval.value.pattern
    return !pattern || RegExp(pattern.regex).test(value)
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
