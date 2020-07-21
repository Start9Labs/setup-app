import { Injectable } from '@angular/core'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import * as CryptoJS from 'crypto-js'

import { Plugins } from '@capacitor/core'
import { HttpOptions, HttpResponse } from '@capacitor-community/http'
const { Http } = Plugins

const version = require('../../../package.json').version

@Injectable({
  providedIn: 'root',
})
export class HttpService {
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

export interface TypedHttpResponse<T> extends HttpResponse {
  data: T
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export function getLanIP (zcs: ZeroconfService): string {
  const { ipv4Addresses, ipv6Addresses } = zcs

  let url: string
  if (ipv4Addresses.length) {
    url = ipv4Addresses[0]
  } else {
    url = `[${ipv6Addresses[0]}]`
  }
  return url
}

export function idFromProductKey (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}
