import { Injectable } from '@angular/core'
import { Clipboard } from '@ionic-native/clipboard/ngx'
import { ToastController, Platform } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {

  constructor (
    private readonly platform: Platform,
    private readonly clipboard: Clipboard,
    private readonly toastCtrl: ToastController,
  ) { }

  async copy (text: string) {
    let message = ''
    if (this.platform.is('cordova')) {
      await this.clipboard.copy(text)
        .then(() => { message = 'copied to clipboard!' })
        .catch(() => { message = 'failed to copy' })
    } else {
      await navigator.clipboard.writeText(text)
        .then(() => { message = 'copied to clipboard!' })
        .catch(() => { message = 'failed to copy' })
    }

    const toast = await this.toastCtrl.create({
      header: message,
      position: 'bottom',
      duration: 1000,
      cssClass: 'notification-toast',
    })
    await toast.present()
  }
}