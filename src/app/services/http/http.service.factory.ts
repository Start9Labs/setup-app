import { RecorderHttpService } from './recorder-http.service'
import { LiveHttpService } from './live-http.service'
import { config } from '../../config'

export function HttpServiceFactory () {
  if (config.http.useMocks) {
    return new RecorderHttpService()
  } else {
    return new LiveHttpService()
  }
}
