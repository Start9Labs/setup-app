import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { NavController } from '@ionic/angular'

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
    private readonly navCtrl: NavController,
  ) { }

  async handleInput (value: string) {
    this.error = ''
    if (value.length === 4) {
      try {
        await this.authService.authenticate(value)
        await this.navCtrl.navigateRoot(['/auth'])
      } catch (e) {
        this.error = e.message
      }
    }
  }

}

