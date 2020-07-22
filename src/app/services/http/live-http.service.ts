import { Injectable } from '@angular/core'
import { Plugins } from '@capacitor/core'
import { HttpOptions } from '@capacitor-community/http'
import { TypedHttpResponse, HttpService } from './http.service'
const { Http } = Plugins
const version = require('../../../../package.json').version

@Injectable()
export class LiveHttpService extends HttpService {
  constructor () { super() }

  async requestFull<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

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

  async request<T> (options: HttpOptions): Promise<T> {
    return this.requestFull<T>(options).then(res => (res.data || ({ } as T)))
  }
}