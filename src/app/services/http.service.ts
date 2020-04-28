import { Injectable } from '@angular/core'
import { HttpPluginNativeImpl, HttpOptions } from 'capacitor-http'
import { Method } from '../types/enums'
const version = require('../../../package.json').version

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor () { }

  async request<T> (options: HttpOptions): Promise<T> {
    options.headers = Object.assign(options.headers || { }, {
      'app-version': version,
      'Content-type': 'application/json',
    })

    if (options.method === Method.post && !options.data) {
      options.data = { }
    }

    try {
      console.log('** REQUEST **: ', options)
      const res = await HttpPluginNativeImpl.request(options)
      console.log('** RESPONSE **: ', res)
      return res.data || { }
    } catch (e) {
      console.error(e)

      let message: string
      try {
        message = JSON.parse(e.error).message
      } catch (e) {
        message = e.error
      }
      throw new Error(message || 'Unknown Error')
    }
  }
}
