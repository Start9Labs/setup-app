import { Component } from '@angular/core'
import { AlertController, NavController } from '@ionic/angular'
import { Store, Device } from '../../store'
import { ActivatedRoute } from '@angular/router'
import { ClipboardService } from '../../services/clipboard.service'

@Component({
  selector: 'device-show',
  templateUrl: './device-show.page.html',
  styleUrls: ['./device-show.page.scss'],
})
export class DeviceShowPage {
  device: Device
  label: string

  constructor (
    private readonly navCtrl: NavController,
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly alertCtrl: AlertController,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit ( ) {
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.device = this.store.peekDevices().find(d => d.productKey === productKey)
    this.label = this.device.label || this.device.type // @COMPAT < 1.2.0
  }

  async copyTor (): Promise<void> {
    this.clipboardService.copy(this.device.torAddress)
  }

  async presentAlertEditLabel () {
    const alert = await this.alertCtrl.create({
      header: 'Device Label',
      inputs: [
        {
          name: 'label',
          type: 'text',
          placeholder: 'Enter Value',
          value: this.label,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data: { label: string }) => {
            this.editLabel(data.label)
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
      header: 'Forget device?',
      message: `This action will have no effect on the device itself.<br /><br />You can re-add the device at any time using its Product Key.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Forget',
          cssClass: 'alert-danger',
          handler: () => {
            this.forget()
          },
        },
      ],
    })
    await alert.present()
  }

  private async editLabel (label: string): Promise<void> {
    await this.store.updateDevice(this.device.productKey, label)
    this.label = label
  }

  private async forget (): Promise<void> {
    await this.store.removeDevice(this.device.productKey)
    if (this.store.peekDevices().length) {
      await this.navCtrl.navigateRoot(['/devices'])
    } else {
      await this.navCtrl.navigateRoot(['/connect'])
    }
  }
}
