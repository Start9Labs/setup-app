import { Component } from '@angular/core'
import * as crypto from '../../../util/crypto.util'
import { AuthService } from 'src/app/services/auth.service'

@Component({
  selector: 'app-keychain-create',
  templateUrl: './keychain-create.page.html',
  styleUrls: ['./keychain-create.page.scss'],
})
export class KeychainCreatePage {
  mnemonic: string[]

  constructor (
    private readonly authService: AuthService,
  ) { }

  ngOnInit () {
    this.mnemonic = crypto.generateMnemonic()
  }

  async login () {
    await this.authService.login(this.mnemonic)
  }

}
