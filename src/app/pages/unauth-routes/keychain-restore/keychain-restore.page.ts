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
    const sanitized = this.mnemonic.trim().toLowerCase()

    if (!new RegExp(/^[a-z\s]+$/).test(sanitized)) {
      this.error = 'invalid characters detected'
      return
    }

    try {
      await this.authService.login(sanitized.split(new RegExp(/\s/)))
    } catch (e) {
      this.error = e.message
    }
  }

}
