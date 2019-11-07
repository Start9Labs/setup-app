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
  isAuthenticated = false

  constructor (
    private readonly platform: Platform,
    private readonly ss: SecureStorage,
    private readonly storage: Storage,
    private readonly router: Router,
  ) {
    this.platform.ready()
      .then(async () => {
        await this.initSecure()
        await this.checkSecure()
      })
  }

  async initSecure () {
    this.secure = await this.ss.create('start9')
  }

  async checkSecure () {
    if (this.platform.is('cordova')) {
      this.secure.get('mnemonic')
        .then(() => {
          this.isAuthenticated = true
        })
        .catch(() => {
          this.isAuthenticated = false
        })
    } else {
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.isAuthenticated = true
      } else {
        this.isAuthenticated = false
      }
    }
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
    this.isAuthenticated = true
    await this.router.navigate(['/servers'])
  }

  async logout () {
    if (this.platform.is('cordova')) {
      await this.secure.remove('mnemonic')
    } else {
      await this.storage.remove('mnemonic')
    }
    this.isAuthenticated = false
    await this.router.navigate(['/welcome'])
  }
}
