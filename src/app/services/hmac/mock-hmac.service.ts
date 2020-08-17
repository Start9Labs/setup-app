import { Injectable } from '@angular/core'
import { HmacService } from './hmac.service'

@Injectable()
export class MockHmacService extends HmacService {
  constructor () { super() }

  async validateHmacExpiration (secretKey: string, hmacHex: string, expirationIso: string, saltHex: string) : Promise<'hmac-invalid' | 'expiration-invalid' | 'success' > {
    return 'success'
  }
}