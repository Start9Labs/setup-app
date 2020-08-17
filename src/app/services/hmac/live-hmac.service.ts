import { Injectable } from '@angular/core'
import { HMAC, decode16 } from '../../util/crypto'
import { HmacService } from './hmac.service'

@Injectable({
  providedIn: 'root',
})
export class LiveHmacService extends HmacService {
  constructor () { super() }

  async validateHmacExpiration (secretKey: string, hmacHex: string, expirationIso: string, saltHex: string) : Promise<'hmac-invalid' | 'expiration-invalid' | 'success' > {
    const validRes = await HMAC.verify256(secretKey, decode16(hmacHex), expirationIso, decode16(saltHex))
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