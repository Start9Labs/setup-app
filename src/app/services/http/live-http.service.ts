import { Injectable } from '@angular/core'
import { HttpOptions } from '@capacitor-community/http'
import { TypedHttpResponse, HttpService } from './http.service'

import { Plugins } from '@capacitor/core'
const { Http } = Plugins

const version = require('../../../../package.json').version

@Injectable()
export class LiveHttpService extends HttpService {

  constructor () { super() }

  async request<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    return Http.request(options).catch(e => {
      console.error(`Http Exception`, e)

      const eObj = {
        message: e.data || e.message || e.toString(),
        status: e.status || e.statusCode || 'Network Error',
      }

      throw new Error(JSON.stringify(eObj, (k, v) => v, '\t'))
    })
  }
}
