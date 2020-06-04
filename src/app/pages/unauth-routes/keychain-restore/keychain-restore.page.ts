import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'app-keychain-restore',
  templateUrl: './keychain-restore.page.html',
  styleUrls: ['./keychain-restore.page.scss'],
})
export class KeychainRestorePage {
  error = ''
  mnemonic: string

  constructor (
    private readonly navCtrl: NavController,
    private readonly authService: AuthService,
  ) { }

  async login () {
    const sanitized = this.mnemonic.trim().toLowerCase()

    if (!new RegExp(/^[a-z\s]+$/).test(sanitized)) {
      this.error = 'invalid characters detected'
      return
    }

    try {
      await this.authService.login(sanitized.split(new RegExp(/\s/)))
      await this.navCtrl.navigateRoot(['/auth'])
    } catch (e) {
      console.error(e)
      this.error = e.message
    }
  }

}
