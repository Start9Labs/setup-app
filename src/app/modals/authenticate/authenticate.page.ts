import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { ModalController, LoadingController } from '@ionic/angular'

@Component({
  selector: 'authenticate',
  templateUrl: 'authenticate.page.html',
  styleUrls: ['authenticate.page.scss'],
})
export class AuthenticatePage {
  error = ''
  passcode = ''

  constructor (
    private readonly authService: AuthService,
    private readonly modalCtrl: ModalController,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async handleInput (value: string) {
    this.error = ''
    if (value.length > 4) {
      this.error = 'Passcode should be 4 digits'
    }
    if (value.length === 4) {
      const loader = await this.loadingCtrl.create({
        spinner: 'lines',
        cssClass: 'loader',
      })
      await loader.present()

      try {
        await this.authService.authenticate(value)
        await this.modalCtrl.dismiss()
      } catch (e) {
        this.error = e.message
      } finally {
        await loader.dismiss()
      }
    }
  }

}

