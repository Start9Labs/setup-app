import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ActionSheetController, isPlatform } from '@ionic/angular'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { Device, Store } from 'src/app/store'

import { Plugins } from '@capacitor/core'
const { CertInstaller } = Plugins

@Component({
  selector: 'lan',
  templateUrl: 'lan.page.html',
  styleUrls: ['lan.page.scss'],
})
export class LANPage {
  device: Device
  isAndroid: boolean

  constructor (
    private readonly store: Store,
    private readonly route: ActivatedRoute,
    private readonly actionSheetCtrl: ActionSheetController,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit ( ) {
    const productKey = this.route.snapshot.paramMap.get('productKey')
    this.isAndroid = isPlatform('android')
    console.log(this.isAndroid)
    this.device = this.store.peekDevices().find(d => d.productKey === productKey)
  }

  async copyLAN (): Promise<void> {
    this.clipboardService.copy('https://' + this.device.lanAddress)
  }

  async presentActionCert () {
    const alert = await this.actionSheetCtrl.create({
      buttons: [
        {
          icon: 'copy-outline',
          text: 'Copy to clipboard',
          handler: () => {
            this.clipboardService.copy(this.device.cert.cert)
          },
        },
        {
          icon: 'save-outline',
          text: 'Save to device',
          handler: () => {
            this.installCert()
          },
        },
      ],
    })
    await alert.present()
  }

  private async installCert (): Promise<void> {
    return CertInstaller.installCert({
      value: this.device.cert.cert,
      name: this.device.cert.name,
      iosInstructionLink: '',
    })
  }

}
