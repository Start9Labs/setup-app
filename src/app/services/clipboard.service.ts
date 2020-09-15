import { Injectable } from '@angular/core'
import { ToastController } from '@ionic/angular'

import { Plugins } from '@capacitor/core'
const { Clipboard } = Plugins

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {

  constructor (
    private readonly toastCtrl: ToastController,
  ) { }

  async copy (string: string): Promise<void> {
    const message = await Clipboard.write({ string })
      .then(() => 'Copied to clipboard!')
      .catch(() => 'failed to copy')

    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      duration: 1000,
    })
    toast.present()
  }
}