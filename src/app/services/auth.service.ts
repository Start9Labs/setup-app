import { Injectable } from '@angular/core'
import { SecureStorageObject, SecureStorage } from '@ionic-native/secure-storage/ngx'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import * as crypto from '../util/crypto.util'
import { BehaviorSubject } from 'rxjs'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private secure: SecureStorageObject
  readonly authState = new BehaviorSubject(AuthStatus.uninitialized)
  mnemonic: string[] | undefined

  constructor (
    private readonly platform: Platform,
    private readonly ss: SecureStorage,
    private readonly storage: Storage,
  ) { }

  async init () {
    if (this.platform.is('cordova')) {
      this.secure = await this.ss.create('start9')
      // throws error if key does not exist
      await this.secure.get('mnemonic')
        .then(mnemonic => {
          this.mnemonic = JSON.parse(mnemonic)
          this.authState.next(AuthStatus.authed)
        })
        .catch(() => {
          this.authState.next(AuthStatus.unauthed)
        })
    } else {
      // returns undefined if key does not exist
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.mnemonic = JSON.parse(mnemonic)
        this.authState.next(AuthStatus.authed)
      } else {
        this.authState.next(AuthStatus.unauthed)
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
    this.mnemonic = mnemonic
    this.authState.next(AuthStatus.authed)
  }

  async logout () {
    await this.storage.remove('servers')
    if (this.platform.is('cordova')) {
      await this.secure.remove('mnemonic')
    } else {
      await this.storage.remove('mnemonic')
    }
    this.authState.next(AuthStatus.unauthed)
    this.mnemonic = undefined
  }

  isAuthenticated (): boolean {
    return this.authState.value === AuthStatus.authed && !!this.mnemonic
  }

  isUnauthenticated (): boolean {
    return this.authState.value === AuthStatus.unauthed
  }
}
