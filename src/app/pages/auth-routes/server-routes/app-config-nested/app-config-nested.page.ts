import { Component, Input } from '@angular/core'
import { ModalController, AlertController } from '@ionic/angular'
import { AppValueSpec, AppValueSpecList, AppValueSpecString } from 'src/app/models/s9-app'

@Component({
  selector: 'app-app-config-nested',
  templateUrl: './app-config-nested.page.html',
  styleUrls: ['./app-config-nested.page.scss'],
})
export class AppConfigNestedPage {
  @Input() keyval: { key: string, value: AppValueSpec }
  @Input() value: any[] | object
  min: number
  max: number
  edited = false

  constructor (
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    if (this.keyval.value.type === 'list') {
      const arr = this.keyval.value.length.split('.')
      this.min = Number(arr[0])
      this.max = Number(arr[arr.length - 1])
    }
  }

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

  async presentAlertConfigValueEdit (index: number) {
    const alert = await this.alertCtrl.create({
      header: this.keyval.key,
      inputs: [
        {
          name: 'value',
          type: 'text',
          value: this.value[index],
          placeholder: 'Enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Done',
          handler: (data: { value: string }) => {
            const value = data.value
            // return if no change
            if (this.value[index] === value) { return }
            // otherwise add/update value and mark edited
            if (this.validate(value)) {
              this.markEdited();
              (this.value as any[]).splice(index, 1, value)
            } else {
              alert.message = ((this.keyval.value as AppValueSpecList).spec as AppValueSpecString).pattern!.description
              return false
            }
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertConfigValueNew () {
    const alert = await this.alertCtrl.create({
      header: this.keyval.key,
      inputs: [
        {
          name: 'value',
          type: 'text',
          placeholder: 'Enter value',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Done',
          handler: (data: { value: string }) => {
            const value = data.value
            // return if no value
            if (!value) { return }
            // otherwise add/update value and mark edited
            if (this.validate(value)) {
              this.markEdited();
              (this.value as any[]).push(value)
            } else {
              alert.message = ((this.keyval.value as AppValueSpecList).spec as AppValueSpecString).pattern!.description
              return false
            }
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertDelete (index: number) {
    const alert = await this.alertCtrl.create({
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
            this.markEdited();
            (this.value as any[]).splice(index, 1)
          },
        },
      ],
    })
    await alert.present()
  }

  validate (value: string): boolean {
    const pattern = ((this.keyval.value as AppValueSpecList).spec as AppValueSpecString).pattern
    return !pattern || RegExp(pattern.regex).test(value)
  }

  markEdited () {
    this.edited = true
  }
}
