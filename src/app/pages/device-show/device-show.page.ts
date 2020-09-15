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
  }

  async copyTor (): Promise<void> {
    this.clipboardService.copy(this.device.torAddress)
  }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Remove?',
      message: `Remove ${this.device.type} from Setup App?<br /><br />This action will have no effect on the ${this.device.type} itself.<br /><br />You can re-add the ${this.device.type} at any time using its Product Key.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove',
          cssClass: 'alert-danger',
          handler: () => {
            this.remove()
          },
        },
      ],
    })
    await alert.present()
  }

  private async remove (): Promise<void> {
    await this.store.removeDevice(this.device.productKey)
    if (this.store.peekDevices().length) {
      await this.navCtrl.navigateRoot(['/devices'])
    } else {
      await this.navCtrl.navigateRoot(['/connect'])
    }
  }
}
