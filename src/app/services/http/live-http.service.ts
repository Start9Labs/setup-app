import { Injectable } from '@angular/core'
import { HttpOptions, HttpPluginNativeImpl } from 'start9labs-capacitor-http'
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

    try {
      const res = await HttpPluginNativeImpl.request(options)
      return res
    } catch (e) {
      console.error(`Http Exception`, e)

      const eObj = {
        message: e.toString(),
        status: e.status || e.statusCode || 'Network Error',
      }

      throw new Error(JSON.stringify(eObj, (k, v) => v, '\t'))
    }
  }
}
