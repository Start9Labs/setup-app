import { Component } from '@angular/core'
import { NavController, ToastController } from '@ionic/angular'
import { copyToClipboard } from 'src/app/util/misc.util'
import { Store } from 'src/app/services/store.service'

@Component({
  selector: 'complete',
  templateUrl: 'complete.page.html',
  styleUrls: ['complete.page.scss'],
})
export class CompletePage {

  constructor (
    private readonly navCtrl: NavController,
    private readonly toastCtrl: ToastController,
    public readonly store: Store,
  ) { }

  async copyTor (): Promise<void> {
    let message: string
    await copyToClipboard(String(this.store.torAddress)).then(success => { message = success ? 'Copied to clipboard!' :  'Failed to copy'})

    const toast = await this.toastCtrl.create({
      header: message,
      position: 'bottom',
      duration: 1000,
    })
    await toast.present()
  }

  async done (): Promise<void> {
    this.navCtrl.navigateRoot(['/connect'])
  }
}
