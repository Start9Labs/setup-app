import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import * as cryptoUtil from '../util/crypto.util'
import { BehaviorSubject } from 'rxjs'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly authState = new BehaviorSubject(AuthStatus.uninitialized)
  mnemonic: string[] | undefined

  constructor (
    private readonly storage: Storage,
  ) { }

  async init () {
    // returns undefined if key does not exist
    const mnemonic = await this.storage.get('mnemonic')
    if (mnemonic) {
      console.log(mnemonic)
      console.log(await cryptoUtil.decrypt(mnemonic, ''))
      this.mnemonic = JSON.parse(await cryptoUtil.decrypt(mnemonic, ''))
      this.authState.next(AuthStatus.authed)
    } else {
      this.authState.next(AuthStatus.unauthed)
    }
  }

  async login (mnemonic: string[]) {
    if (!cryptoUtil.checkMnemonic(mnemonic)) {
      throw new Error('invalid mnemonic')
    }
    await this.storage.set('mnemonic', cryptoUtil.encrypt(JSON.stringify(mnemonic), ''))
    this.mnemonic = mnemonic
    this.authState.next(AuthStatus.authed)
  }

  async logout () {
    await this.storage.remove('servers')
    await this.storage.remove('mnemonic')
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
