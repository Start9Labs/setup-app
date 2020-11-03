import { Injectable } from '@angular/core'
import { HttpPluginNativeImpl, HttpOptions } from '@start9labs/capacitor-http'
import { TypedHttpResponse, HttpService } from './http.service'

const version = require('../../../../package.json').version

@Injectable()
export class LiveHttpService extends HttpService {

  constructor () { super() }

  async request<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    return HttpPluginNativeImpl.request(options).catch(e => {
      console.error(`Http Exception`, e)

      const eObj = {
        message: e.data || e.message || JSON.stringify(e),
        status: e.status || e.statusCode || 0,
      }

      throw new Error(JSON.stringify(eObj, (k, v) => v, '\t'))
    })
  }
}
