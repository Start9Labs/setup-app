import { Component, Input, Output, EventEmitter } from '@angular/core'
import { AppConfigSpec, AppValueSpec, AppValueSpecString } from 'src/app/models/s9-app'
import { AlertController, ModalController } from '@ionic/angular'
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
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  async presentDescription (keyval: { key: string, value: AppValueSpec }, e: Event) {
    e.stopPropagation()
    const alert = await this.alertCtrl.create({
      header: keyval.key,
      message: keyval.value.description,
    })
    await alert.present()
  }

  async presentModalConfig (keyval: { key: string, value: AppValueSpec }) {
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

  validate (keyval: { key: string, value: AppValueSpecString }) {
    const pattern = keyval.value.pattern
    if (pattern) {
      const value = this.config[keyval.key]
      if (!RegExp(pattern.regex).test(value)) {
        keyval.value.error = true
      } else {
        keyval.value.error = false
      }
    }
  }

  markEdited () {
    this.editedChange.emit(true)
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
