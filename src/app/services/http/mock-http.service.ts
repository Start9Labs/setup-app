import { Injectable } from '@angular/core'
import { HttpOptions, HttpResponse } from '@capacitor-community/http'
import { HttpService, TypedHttpResponse } from './http.service'

const version = require('../../../../package.json').version

@Injectable()
export class MockHttpService extends HttpService {
  readonly requestRecord: HttpOptions[] = []
  readonly respondWith: { [path: string]: HttpResponse } = {
    '/v0/hosts': {
      status: 200,
      data: {
        claimedAt: new Date().toISOString(),
        torAddress: 'privacy34kn4ez3y3nijweec6w4g54i3g54sdv7r5mr6soma3w4begyd.onion',
        // lanAddress: 'start9-12345678.local',
        // cert: 'hello-cert',
      },
      headers: { },
    },
    '/v0/register': {
      status: 200,
      data: {
        claimedAt: new Date().toISOString(),
        torAddress: 'privacy34kn4ez3y3nijweec6w4g54i3g54sdv7r5mr6soma3w4begyd.onion',
        // lanAddress: 'start9-12345678.local',
        // cert: 'hello-cert',
      },
      headers: { },
    },
    '*': { status: 200, data: { }, headers: { } },
  }

  async request<T> (options: HttpOptions): Promise<TypedHttpResponse<T>> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    try {
      this.requestRecord.push(options)
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

  private response<T> (options: HttpOptions): TypedHttpResponse<T> {
    const path = new URL(options.url).pathname
    return this.respondWith[path] || this.respondWith['*']
  }
}