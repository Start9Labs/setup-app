import { Injectable } from '@angular/core'
import * as cryptoUtil from '../util/crypto.util'
import { BehaviorSubject, Observable } from 'rxjs'
import { AuthStatus } from '../types/enums'

import { Plugins } from '@capacitor/core'
const { Storage } = Plugins

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authState$ = new BehaviorSubject<AuthStatus>(AuthStatus.UNINITIALIZED)
  watch (): Observable<AuthStatus> { return this.authState$.asObservable() }
  mnemonicEncrypted: cryptoUtil.Hex | null = null
  mnemonic: string[] | undefined
  pinEnabled = false

  constructor () { }

  async init () {
    this.mnemonicEncrypted = (await Storage.get({ key: 'mnemonic' })).value as cryptoUtil.Hex | null

    if (this.mnemonicEncrypted) {
      try {
        await this.authenticate('')
      } catch (e) {
        this.pinEnabled = true
        this.authState$.next(AuthStatus.UNVERIFIED)
      }
    } else {
      this.authState$.next(AuthStatus.MISSING)
    }
  }

  async authenticate (pin: string): Promise<void> {
    const decrypted = await cryptoUtil.decrypt(this.mnemonicEncrypted!, pin)
    this.mnemonic = JSON.parse(decrypted)
    this.authState$.next(AuthStatus.VERIFIED)
  }

  uninit (): void {
    this.clearCache()
    this.authState$.next(AuthStatus.UNINITIALIZED)
  }

  async login (mnemonic: string[]): Promise<void> {
    if (!cryptoUtil.checkMnemonic(mnemonic)) {
      throw new Error('invalid mnemonic')
    }

    this.mnemonic = mnemonic
    this.pinEnabled = false

    await this.encryptMnemonic('')

    this.authState$.next(AuthStatus.VERIFIED)
  }

  async encryptMnemonic (pin: string) {
    const mnemonicEncrypted = await cryptoUtil.encrypt(JSON.stringify(this.mnemonic), pin)
    this.mnemonicEncrypted = mnemonicEncrypted

    await Storage.set({ key: 'mnemonic', value: mnemonicEncrypted })
  }

  async logout (): Promise<void> {
    this.clearCache()
    await Storage.clear()
    this.authState$.next(AuthStatus.MISSING)
  }

  async changePin (pin: string): Promise<void> {
    await this.encryptMnemonic(pin)
    this.pinEnabled = !!pin
  }

  async clearCache () {
    this.mnemonicEncrypted = null
    this.mnemonic = undefined
    this.pinEnabled = false
  }

  isUnverified (): boolean {
    return this.authState$.value === AuthStatus.UNVERIFIED && !!this.mnemonicEncrypted && !this.mnemonic
  }

  isVerified (): boolean {
    return this.authState$.value === AuthStatus.VERIFIED && !!this.mnemonicEncrypted && !!this.mnemonic
  }

  isMissing (): boolean {
    return this.authState$.value === AuthStatus.MISSING && !this.mnemonicEncrypted && !this.mnemonic
  }
}
