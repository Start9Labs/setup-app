import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { AppConfigSpec, AppValueSpec } from 'src/app/models/s9-app'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() spec: AppConfigSpec
  @Input() value: any
  edited = false

  constructor (
    private readonly modalCtrl: ModalController,
  ) { }

  async dismiss () {
    this.modalCtrl.dismiss({
      edited: this.edited,
      value: this.value,
    })
  }

  async presentModalConfig (spec: { key: string, value: AppValueSpec }) {
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

  markEdited () {
    this.edited = true
  }
}
