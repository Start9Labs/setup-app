import { MockHmacService } from './mock-hmac.service'
import { LiveHmacService } from './live-hmac.service'
import { config } from '../../config'

export function HmacServiceFactory () {
  if (config.hmac.useMocks) {
    return new MockHmacService()
  } else {
    return new LiveHmacService()
  }
}
