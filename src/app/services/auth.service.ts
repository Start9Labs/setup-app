import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import * as cryptoUtil from '../util/crypto.util'
import { BehaviorSubject, Observable } from 'rxjs'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authState$ = new BehaviorSubject<AuthStatus>(AuthStatus.UNINITIALIZED)
  watch (): Observable<AuthStatus> { return this.authState$ }
  mnemonicEncrypted: cryptoUtil.Hex | null = null
  mnemonic: string[] | undefined
  passcodeEnabled = false

  constructor (
    private readonly storage: Storage,
  ) { }

  async init () {
    // returns null if key does not exist
    this.mnemonicEncrypted = await this.storage.get('mnemonic') as cryptoUtil.Hex

    if (this.mnemonicEncrypted) {
      try {
        await this.authenticate('')
      } catch (e) {
        this.passcodeEnabled = true
        this.authState$.next(AuthStatus.UNVERIFIED)
      }
    } else {
      this.authState$.next(AuthStatus.MISSING)
    }
  }

  async authenticate (passcode: string): Promise<void> {
    const decrypted = await cryptoUtil.decrypt(this.mnemonicEncrypted!, passcode)
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
    this.passcodeEnabled = false

    await this.encryptMnemonic('')

    this.authState$.next(AuthStatus.VERIFIED)
  }

  async encryptMnemonic (pin: string) {
    const mnemonicEncrypted = await cryptoUtil.encrypt(JSON.stringify(this.mnemonic), pin)
    this.mnemonicEncrypted = mnemonicEncrypted

    await this.storage.set('mnemonic', mnemonicEncrypted)
  }

  async logout (): Promise<void> {
    this.clearCache()
    await this.storage.clear()
    this.authState$.next(AuthStatus.MISSING)
  }

  async changePasscode (passcode: string): Promise<void> {
    await this.encryptMnemonic(passcode)
    this.passcodeEnabled = !!passcode
  }

  async clearCache () {
    this.mnemonicEncrypted = null
    this.mnemonic = undefined
    this.passcodeEnabled = false
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
