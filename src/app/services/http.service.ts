import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Method } from '../types/enums'
import { Observable } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { getLanIP, S9Server } from '../models/s9-server'
import { TokenSigner } from 'jsontokens'
import { clone } from '../models/server-model'
import { S9BuilderWith } from './setup.service'
const APP_VERSION = '1.0.0'

@Injectable()
export class HttpService {

  constructor (
    private readonly http: HttpClient,
  ) { }

  async authServerRequest<T> (
    ss: S9Server | S9BuilderWith<'zeroconfService' | 'privkey'>,
    method: Method,
    path: string,
    httpOptions: HttpOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const authOptions = appendAuthOptions(ss, httpOptions)
    return this.serverRequest(ss, method, path, authOptions, body, TIMEOUT)
  }

  async serverRequest<T> (
    ss: S9Server | S9BuilderWith<'zeroconfService'>,
    method: Method,
    path: string,
    httpOptions: HttpOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const url = s9Url(ss, path)
    return this.request(method, url, httpOptions, body, TIMEOUT)
  }

  async request<T> (method: Method, url: string, httpOptions: HttpOptions = { }, body: any = { }, TIMEOUT = 30000): Promise<T> {
    const newOptions = appendDefaultOptions(httpOptions)

    let call: () => Observable<HttpEvent<T>>
    switch (method) {
      case Method.get:
        call = () => this.http.get<T>(url, newOptions as any)
        break
      case Method.post:
        call = () => this.http.post<T>(url, body, newOptions as any)
        break
      case Method.patch:
        call = () => this.http.patch<T>(url, body, newOptions as any)
        break
      case Method.delete:
        call = () => this.http.delete<T>(url, newOptions as any)
        break
      default: // makes tsc happy
          call = () => this.http.get<T>(url, newOptions as any)
    }

    try {
      const response = await call()
        .pipe(timeout(TIMEOUT))
        .toPromise()
      if (response.type === HttpEventType.Response) {
        return response.body as T
      } else {
        throw new Error(`Expected HTTP Event Type, got ${response.type}`)
      }
    } catch (e) {
      console.error(e)
      const error: HttpErrorResponse = e
      const message = error.error || error
      throw new Error(message)
    }
  }
}

function s9Url (ss: S9Server | S9BuilderWith<'zeroconfService'>, path: string): string {
  const host = getLanIP(ss.zeroconfService) || ss.torAddress
  return `http://${host}/v0${path}`
}


function appendAuthOptions (ss: S9Server | S9BuilderWith<'privkey'>, httpOptions: HttpOptions): HttpOptions & { headers: HttpHeaders } {
  const optClone = clone(httpOptions)
  let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()

  const tokenPayload = { 'iss': 'start9-companion', 'exp': new Date(new Date().getTime() + 3000) }
  const token = new TokenSigner('ES256K', ss.privkey).sign(tokenPayload)
  headers = headers.set('Authorization', 'Bearer ' + token)

  return { ...optClone, headers }
}

function appendDefaultOptions (httpOptions: HttpOptions): HttpOptions & { headers: HttpHeaders } {
  const optClone = clone(httpOptions)
  let headers: HttpHeaders = optClone.headers || new HttpHeaders()
  // always set app-version
  headers = headers.set('app-version', APP_VERSION)
  // finalize options
  optClone.observe = 'response'

  return { ...optClone, headers }
}

export interface HttpOptions {
  params?: { [key: string]: string }
  headers?: HttpHeaders
  responseType?: 'json' | 'text'
  observe?: 'response'
}