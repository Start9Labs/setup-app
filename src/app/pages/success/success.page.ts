import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { NavController, Platform } from '@ionic/angular'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { Device, Store } from 'src/app/store'

@Component({
  selector: 'success',
  templateUrl: 'success.page.html',
  styleUrls: ['success.page.scss'],
})
export class SuccessPage {
  device: Device
  plat: 'ios' | 'android'

  constructor (
    private readonly navCtrl: NavController,
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly platform: Platform,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit ( ) {
    this.plat = this.platform.is('ios') ? 'ios' : 'android'
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.device = this.store.peekDevices().find(d => d.productKey === productKey)
  }

  async copyTor (): Promise<void> {
    this.clipboardService.copy(this.device.torAddress)
  }

  async done (): Promise<void> {
    this.navCtrl.navigateRoot(['/devices', this.device.productKey])
  }

}
