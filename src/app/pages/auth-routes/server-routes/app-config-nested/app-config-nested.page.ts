import { Component, Input } from '@angular/core'
import { AppConfigSpec, AppValueSpec } from 'src/app/models/s9-app'
import { ModalController, AlertController } from '@ionic/angular'
import { clone } from 'src/app/models/server-model'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() spec: AppConfigSpec
  @Input() value: any
  edited = false
  error: string

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

  async presentModalConfig (spec: { key: string, value: string }) {
    const modal = await this.modalCtrl.create({
      component: AppConfigNestedPage,
      componentProps: {
        spec,
        value: this.value[spec.key],
      },
    })

    modal.onWillDismiss().then(res => {
      this.edited = this.edited || res.data.edited
      this.value[spec.key] = res.data.value
    })

    await modal.present()
  }

  async dismiss () {
    this.modalCtrl.dismiss({
      edited: this.edited,
      value: this.value,
    })
  }

  markEdited () {
    this.edited = true
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
