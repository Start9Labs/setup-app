import { Injectable } from '@angular/core'
import { HMAC, decode16 } from '../../util/crypto'
import { HmacService } from './hmac.service'

@Injectable()
export class LiveHmacService extends HmacService {
  constructor () { super() }

  async validateHmac (secretKey: string, hmacHex: string, message: string, saltHex: string) : Promise<boolean> {
    return HMAC.verify256(secretKey, decode16(hmacHex), message, decode16(saltHex))
  }
}
