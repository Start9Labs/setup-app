import { Component } from '@angular/core'
import * as cryptoUtil from '../../../util/crypto.util'
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
    this.mnemonic = cryptoUtil.generateMnemonic()
  }

  async login () {
    await this.authService.login(this.mnemonic)
  }

}
