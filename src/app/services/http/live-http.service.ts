import { Injectable } from '@angular/core'
import { HttpOptions } from '@capacitor-community/http'
import { TypedHttpResponse, HttpService } from './http.service'

import { Plugins } from '@capacitor/core'
const { Http } = Plugins

const version = require('../../../../package.json').version

@Injectable()
export class LiveHttpService extends HttpService {
  constructor (private readonly fullLogs: boolean) { super() }

  async request<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    if (this.fullLogs) console.log(`requestFull body`, JSON.stringify(JSON.stringify(options.data)))

    try {
      return Http.request(options)
    } catch (e) {
      console.error(e)

      let message: string
      try {
        message = JSON.parse(e.error).message
      } catch (e) {
        message = e.error || 'Unknown Error'
      }
      throw new Error(message)
    }
  }
}