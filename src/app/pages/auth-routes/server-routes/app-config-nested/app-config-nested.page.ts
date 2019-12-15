import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { AppValueSpec, AppValueSpecList, AppValueSpecString } from 'src/app/models/s9-app'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() keyval: { key: string, value: AppValueSpec }
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

  async presentModalConfig (keyval: { key: string, value: AppValueSpec }) {
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

  validate (listSpec: AppValueSpecList, i: number) {
    const stringSpec = listSpec.spec as AppValueSpecString
    const pattern = stringSpec.pattern
    if (pattern) {
      const value = this.value[i]
      if (!RegExp(pattern.regex).test(value)) {
        listSpec.errors = listSpec.errors ? listSpec.errors.concat(i) : [i]
      } else {
        listSpec.errors = listSpec.errors ? listSpec.errors.splice(i, 1) : undefined
      }
    }
  }

  markEdited () {
    this.edited = true
  }
}
