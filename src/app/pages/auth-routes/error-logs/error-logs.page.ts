import { Component, ViewChild } from '@angular/core'
import { IonContent, AlertController, ToastController, LoadingController, IonicSafeString } from '@ionic/angular'
import { Store } from 'src/app/store'
import { HttpService, Method } from 'src/app/services/http.service'

@Component({
  selector: 'error-logs',
  templateUrl: './error-logs.page.html',
  styleUrls: ['./error-logs.page.scss'],
})
export class ErrorLogsPage {
  @ViewChild(IonContent, { static: false }) private content: IonContent
  display: string

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly toastCtrl: ToastController,
    private readonly loadingCtrl: LoadingController,
    private readonly http: HttpService,
    private readonly store: Store,
  ) { }

  async ngOnInit () {
    this.display = this.store.errorLogs.join('\n\n')
    setTimeout(async () => await this.content.scrollToBottom(100), 200)
  }

  async presentAlertShareLogs (): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: 'Do you agree to share these (and only these) error logs with the Start9 development team to help resolve your issue?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Yes, Share Logs',
          handler: () => {
            this.shareLogs()
          },
        },
      ],
    })
    await alert.present()
  }

  async shareLogs (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Sharing logs...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.http.rawRequest({
        method: Method.POST,
        url: 'https://logs.start9labs.com/submit/error',
        data: { logs: this.store.errorLogs },
      })
      await this.presentToastResult(true)
    } catch (e) {
      console.error(e)
      await this.presentToastResult(false)
    } finally {
      loader.dismiss()
    }
  }

  async presentToastResult (success: boolean): Promise<void> {
    let message: IonicSafeString

    if (success) {
      message = new IonicSafeString('<ion-icon style="display: inline-block; vertical-align: middle;" name="checkmark-circle-outline" color="success"></ion-icon> <span style="display: inline-block; vertical-align: middle;">Successfully shared logs</span>')
    } else {
      message = new IonicSafeString('<ion-icon style="display: inline-block; vertical-align: middle;" name="warning-outline" color="danger"></ion-icon> <span style="display: inline-block; vertical-align: middle;">Failed to share logs</span>')
    }

    const toast = await this.toastCtrl.create({
      message,
      position: 'bottom',
      duration: 2000,
      cssClass: 'notification-toast',
    })
    await toast.present()
  }
}
