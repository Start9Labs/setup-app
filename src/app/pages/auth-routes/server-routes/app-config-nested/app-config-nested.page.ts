import { Component, Input } from '@angular/core'
import { AppConfigSpec } from 'src/app/models/s9-app'
import { ModalController } from '@ionic/angular'
import { clone } from 'src/app/models/server-model'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() spec: AppConfigSpec
  @Input() value: any
  error: string

  constructor (
    private readonly modalCtrl: ModalController,
  ) { }

  ngOnInit () {
    console.log(this.spec)
    console.log(this.value)
  }

  async presentModalConfig (spec: { key: string, value: string }) {
    const modal = await this.modalCtrl.create({
      component: AppConfigNestedPage,
      componentProps: {
        spec,
        value: clone(this.value[spec.key]),
      },
    })

    modal.onWillDismiss().then(res => {
      this.value[spec.key] = res.data.value
    })

    await modal.present()
  }

  async dismiss () {
    this.modalCtrl.dismiss({
      value: this.value,
    })
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
