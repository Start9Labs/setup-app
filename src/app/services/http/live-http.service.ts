import { Injectable } from '@angular/core'
import { HttpOptions, HttpResponse } from '@capacitor-community/http'
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
      return Http.request(options).then( (res: HttpResponse) => {
        const httpStatus = toHttpStatus(res.status)
        if (isError(httpStatus)) throw { message: httpStatus, name: `http-error: ${res.status}` }
        return res
      })
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
