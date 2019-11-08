import { Injectable } from '@angular/core'
import { SecureStorageObject, SecureStorage } from '@ionic-native/secure-storage/ngx'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { Router } from '@angular/router'
import * as crypto from '../util/crypto.util'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private secure: SecureStorageObject
  mnemonic: string[] | undefined

  constructor (
    private readonly platform: Platform,
    private readonly ss: SecureStorage,
    private readonly storage: Storage,
    private readonly router: Router,
  ) { }

  async checkedAuthenticated () {
    await this.initSecure()
    await this.checkSecure()
  }

  async login (mnemonic: string[]) {
    if (!crypto.checkMnemonic(mnemonic)) {
      throw new Error('invalid mnemonic')
    }
    if (this.platform.is('cordova')) {
      await this.secure.set('mnemonic', JSON.stringify(mnemonic))
    } else {
      await this.storage.set('mnemonic', JSON.stringify(mnemonic))
    }
    this.mnemonic = mnemonic
    await this.router.navigate(['/servers'])
  }

  async logout () {
    await this.storage.remove('servers')
    if (this.platform.is('cordova')) {
      await this.secure.remove('mnemonic')
    } else {
      await this.storage.remove('mnemonic')
    }
    this.mnemonic = undefined
    await this.router.navigate(['/welcome'])
  }

  private async initSecure () {
    this.secure = await this.ss.create('start9')
  }

  private async checkSecure () {
    if (this.platform.is('cordova')) {
      this.secure.get('mnemonic')
        .then((mnemonic) => {
          this.mnemonic = JSON.parse(mnemonic)
        })
        .catch(() => {
          this.mnemonic = undefined
        })
    } else {
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.mnemonic = JSON.parse(mnemonic)
      } else {
        this.mnemonic = undefined
      }
    }
  }

  isAuthenticated () {

  }
}
