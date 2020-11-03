import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { isPlatform, NavController } from '@ionic/angular'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { Device, Store } from 'src/app/store'

@Component({
  selector: 'tor',
  templateUrl: 'tor.page.html',
  styleUrls: ['tor.page.scss'],
})
export class TorPage {
  device: Device
  plat: 'ios' | 'android'
  success: boolean

  constructor (
    private readonly navCtrl: NavController,
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit ( ) {
    this.plat = isPlatform('ios') ? 'ios' : 'android'
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.success = !!this.route.snapshot.queryParamMap.get('success')
    this.device = this.store.peekDevices().find(d => d.productKey === productKey)
  }

  async copyTor (): Promise<void> {
    this.clipboardService.copy(this.device.torAddress)
  }

  async done (): Promise<void> {
    this.navCtrl.navigateRoot(['/devices', this.device.productKey])
  }
}
