import { Component } from '@angular/core'
import * as crypto from '../../../util/crypto.util'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-keychain-restore',
  templateUrl: './keychain-restore.page.html',
  styleUrls: ['./keychain-restore.page.scss'],
})
export class KeychainRestorePage {
  error: string
  mnemonic: string
  isMnemonicEntered = false

  constructor (
    private readonly authService: AuthService,
  ) { }

  checkLength (e: any) {
    const length = e.target.value.trim().replace(/ +/g, ' ').split(' ').length
    this.isMnemonicEntered = length === 12
    this.error = length > 12 ? 'Too many words. Mnemonic should be 12 words in length.' : ''
  }

  async login () {
    try {
      await this.authService.login(this.mnemonic.split(new RegExp('[^a-z]+')))
    } catch (e) {
      this.error = e.message
    }
  }

}
