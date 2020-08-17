import { Injectable } from '@angular/core'
import { HmacService } from './hmac.service'

@Injectable({
  providedIn: 'root',
})
export class MockHmacService extends HmacService {
  constructor () { super() }

  async validateHmacExpiration (secretKey: string, hmac: Uint8Array, expirationIso: string, salt: Uint8Array) : Promise<'hmac-invalid' | 'expiration-invalid' | 'success' > {
    return 'success'
  }
}