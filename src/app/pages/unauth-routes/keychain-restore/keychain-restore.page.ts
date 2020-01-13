import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-keychain-restore',
  templateUrl: './keychain-restore.page.html',
  styleUrls: ['./keychain-restore.page.scss'],
})
export class KeychainRestorePage {
  error: string
  mnemonic: string

  constructor (
    private readonly authService: AuthService,
  ) { }

  async login () {
    try {
      await this.authService.login(this.mnemonic.split(new RegExp('[^a-z]+')))
    } catch (e) {
      this.error = e.message
    }
  }

}
