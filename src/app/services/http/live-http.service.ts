import { Injectable } from '@angular/core'
import { HttpOptions, HttpResponse } from '@capacitor-community/http'
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

    return Http.request(options).then((res: HttpResponse) => {
      const httpStatus = toHttpStatus(res.status)
      if (isError(httpStatus)) {
        const message = res.data ? `${res.data.code || 'SERVER_ERROR'}: ${res.data.message || 'unknown error'}` : httpStatus
        throw new Error(message)
      }
      if (res.status === 209) throw new Error('Device already claimed')
      return res
    })
  }
}

function toHttpStatus (status: number): HttpStatus {
  if ( status < 200 ) return HttpStatus['1xx']
  if ( 200 <= status && status < 300 ) return HttpStatus['2xx']
  if ( 300 <= status && status < 400 ) return HttpStatus['3xx']
  if ( 400 <= status && status < 500 ) return HttpStatus['4xx']
  if ( 500 <= status ) return HttpStatus['5xx']
}

function isError ( s: HttpStatus ): boolean {
  switch (s) {
    case HttpStatus['4xx']:
    case HttpStatus['5xx']: return true
    default: return false
  }
}

export enum HttpStatus {
  '1xx' = 'Informational',
  '2xx' = 'Success',
  '3xx' = 'Redirect',
  '4xx' = 'Client Error',
  '5xx' = 'Server Error',
}
