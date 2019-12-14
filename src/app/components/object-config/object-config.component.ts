import { Component, Input, Output, EventEmitter } from '@angular/core'
import { AppConfigSpec, AppValueSpec } from 'src/app/models/s9-app'
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

  async presentDescription (spec: { key: string, value: AppValueSpec }, e: Event) {
    e.stopPropagation()
    const alert = await this.alertCtrl.create({
      header: spec.key,
      message: spec.value.description,
    })
    await alert.present()
  }

  async presentModalConfig (spec: { key: string, value: AppValueSpec }) {
    const modal = await this.modalCtrl.create({
      component: AppConfigNestedPage,
      componentProps: {
        spec,
        value: this.config[spec.key],
      },
    })

    modal.onWillDismiss().then(res => {
      this.editedChange.emit(this.edited || res.data.edited)
      this.config[spec.key] = res.data.value
    })

    await modal.present()
  }

  markEdited () {
    this.editedChange.emit(true)
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
