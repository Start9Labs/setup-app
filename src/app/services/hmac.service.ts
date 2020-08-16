import { Injectable } from '@angular/core'
import { HMAC } from '../util/crypto'

@Injectable({
  providedIn: 'root',
})
export class HmacService {
  constructor () { }

  async validateHmacExpiration (secretKey: string, hmac: Uint8Array, expirationIso: string, salt: Uint8Array) : Promise<'hmac-invalid' | 'expiration-invalid' | 'success' > {
    const validRes = await HMAC.verify256(secretKey, hmac, expirationIso, salt)
    if (!validRes) return 'hmac-invalid'
    const withinExp = notExpired(expirationIso)
    if (!withinExp) return 'expiration-invalid'
    return 'success'
  }
}

function notExpired (isoString: string): boolean {
  try {
    const now = new Date()
    const expiration = new Date(isoString)
    return now < expiration
  } catch (e) {
    console.error(`isoString ${isoString} not valid`)
    return false
  }
}