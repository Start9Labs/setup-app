import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { SecureStorageObject, SecureStorage } from '@ionic-native/secure-storage/ngx'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  secure: SecureStorageObject
  authenticationState = new BehaviorSubject(false)

  constructor (
    private readonly platform: Platform,
    private readonly ss: SecureStorage,
    private readonly storage: Storage,
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
          this.authenticationState.next(true)
        })
        .catch(() => {
          this.authenticationState.next(false)
        })
    } else {
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.authenticationState.next(true)
      } else {
        this.authenticationState.next(false)
      }
    }
  }

  async login (mnemonic: string[]) {
    await this.secure.set('mnemonic', JSON.stringify(mnemonic))
    this.authenticationState.next(true)
  }

  async logout () {
    await this.secure.remove('mnemonic')
    this.authenticationState.next(false)
  }

  isAuthenticated () {
    return this.authenticationState.value
  }
}
