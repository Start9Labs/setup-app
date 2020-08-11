import { Injectable } from '@angular/core'
import { HttpOptions, HttpResponse } from '@capacitor-community/http'
import { HttpService, TypedHttpResponse } from './http.service'

const version = require('../../../../package.json').version

@Injectable()
export class RecorderHttpService extends HttpService {
  readonly requestRecord: HttpOptions[] = []
  readonly respondWith: { [path: string]: HttpResponse } = {
    '*': { status: 200, data: { }, headers: { } },
  }

  async requestFull<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    try {
      console.log(`requestFull`, options)
      console.log(`requestBody`, JSON.stringify(options.data))
      this.requestRecord.push(options)
      console.log(this.response)
      return this.response(options)
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
    console.log(`request`, options)
    return this.requestFull<T>(options).then(res => (res.data || ({ } as T)))
  }

  private response<T> (options: HttpOptions): TypedHttpResponse<T> {
    return this.respondWith[options.url] || this.respondWith['*']
  }
}