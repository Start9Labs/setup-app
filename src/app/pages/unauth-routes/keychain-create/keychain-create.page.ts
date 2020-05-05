import { Component } from '@angular/core'
import { AuthService } from 'src/app/services/auth.service'
import { NavController } from '@ionic/angular'
import * as cryptoUtil from '../../../util/crypto.util'

@Component({
  selector: 'app-keychain-create',
  templateUrl: './keychain-create.page.html',
  styleUrls: ['./keychain-create.page.scss'],
})
export class KeychainCreatePage {
  mnemonic: string[]

  constructor (
    private readonly navCtrl: NavController,
    private readonly authService: AuthService,
  ) { }

  ngOnInit () {
    this.mnemonic = cryptoUtil.generateMnemonic()
  }

  async login () {
    await this.authService.login(this.mnemonic)
    await this.navCtrl.navigateRoot(['/auth'])
  }

}
