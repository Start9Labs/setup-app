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
  pin = ''

  constructor (
    private readonly authService: AuthService,
    private readonly modalCtrl: ModalController,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async handleInput () {
    if (this.pin.length > 4) {
      this.error = 'Pin should be 4 digits'
    }
    if (this.pin.length === 4) {
      const loader = await this.loadingCtrl.create({
        spinner: 'lines',
        cssClass: 'loader',
      })
      await loader.present()

      try {
        await this.authService.authenticate(this.pin)
        await this.modalCtrl.dismiss()
      } catch (e) {
        this.pin = ''
        this.error = e.message
      } finally {
        await loader.dismiss()
      }
    }
  }

}

