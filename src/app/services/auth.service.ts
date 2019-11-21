import { Injectable } from '@angular/core'
import { SecureStorageObject, SecureStorage } from '@ionic-native/secure-storage/ngx'
import { Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import * as crypto from '../util/crypto.util'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private secure: SecureStorageObject
  readonly authState = new BehaviorSubject(false)
  initialized = false
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
          this.authState.next(true)
        })
        .catch(e => console.error(e))
    } else {
      // returns undefined if key does not exist
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.mnemonic = JSON.parse(mnemonic)
        this.authState.next(true)
      }
    }
    this.initialized = true
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
    this.authState.next(true)
  }

  async logout () {
    await this.storage.remove('servers')
    if (this.platform.is('cordova')) {
      await this.secure.remove('mnemonic')
    } else {
      await this.storage.remove('mnemonic')
    }
    this.authState.next(false)
    this.mnemonic = undefined
  }

  isAuthenticated (): boolean {
    return this.authState.value
  }
}
