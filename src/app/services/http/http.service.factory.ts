import { MockHttpService } from './mock-http.service'
import { LiveHttpService } from './live-http.service'
import { config } from '../../config'

export function HttpServiceFactory () {
  if (config.http.useMocks) {
    return new MockHttpService()
  } else {
    return new LiveHttpService(config.http.customLogReqs)
  }
}
