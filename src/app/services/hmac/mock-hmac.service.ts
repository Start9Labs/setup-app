import { Injectable } from '@angular/core'
import { HmacService } from './hmac.service'

@Injectable()
export class MockHmacService extends HmacService {
  constructor () { super() }

  async validateHmac (secretKey: string, hmacHex: string, expirationIso: string, saltHex: string) : Promise<'hmac-invalid' | 'success' > {
    return 'success'
  }
}