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
  mnemonic: string[] | undefined
  readonly authState = new BehaviorSubject(undefined as (string[] | undefined))

  constructor (
    private readonly platform: Platform,
    private readonly ss: SecureStorage,
    private readonly storage: Storage,
  ) {
    this.platform.ready().then(() => {
      this.init()
    })
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
    this.authState.next(mnemonic)
  }

  async logout () {
    await this.storage.remove('servers')
    if (this.platform.is('cordova')) {
      await this.secure.remove('mnemonic')
    } else {
      await this.storage.remove('mnemonic')
    }
    this.authState.next(undefined)
    this.mnemonic = undefined
  }

  private async init () {
    this.secure = await this.ss.create('start9')

    if (this.platform.is('cordova')) {
      this.secure.get('mnemonic')
        .then(mnemonic => {
          this.mnemonic = JSON.parse(mnemonic)
          this.authState.next(this.mnemonic)
        })
        .catch(e => console.error(e))
    } else {
      const mnemonic = await this.storage.get('mnemonic')
      if (mnemonic) {
        this.mnemonic = JSON.parse(mnemonic)
        this.authState.next(this.mnemonic)
      }
    }
  }

  isAuthenticated () {
    return !!this.mnemonic && !!this.authState.value
  }
}
