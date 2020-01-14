import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Method } from '../types/enums'
import { Observable } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { getLanIP, S9Server, ServerModel } from '../models/server-model'
import { TokenSigner } from 'jsontokens'
import { S9BuilderWith } from './setup.service'
const APP_VERSION = '1.0.0'

@Injectable({
  providedIn: 'root',
})
export class HttpService {

  constructor (
    private readonly http: HttpClient,
    private readonly serverModel: ServerModel,
  ) { }

  async authServerRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled' | 'privkey'>,
    method: Method,
    path: string,
    httpOptions: HttpOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const authOptions = appendAuthOptions(server, httpOptions)
    return this.serverRequest(server, method, path, authOptions, body, TIMEOUT)
  }

  async serverRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled'>,
    method: Method,
    path: string,
    httpOptions: HttpOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const url = this.s9Url(server, path)
    return this.request(method, url, httpOptions, body, TIMEOUT)
  }

  async request<T> (method: Method, url: string, httpOptions: HttpOptions = { }, body: any = { }, TIMEOUT = 30000): Promise<T> {
    const newOptions = appendDefaultOptions(httpOptions)
    // console.log('Request Method: ', method)
    // console.log('Request URL: ', url)
    // console.log('Request Body: ', body)
    // console.log('Request Options: ', newOptions)

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
      console.error('http request error:', e)
      // @TODO remove
      console.error('stringified error:', JSON.stringify(e))
      let message: string
      if (e.error && typeof e.error === 'object') {
        message = e.error.message || e.message || JSON.stringify(e.error)
      } else if (e.errors && e.errors.length && Array.isArray(e.errors)) {
        const error = e.errors[0]
        message = error.message || JSON.stringify(error)
      } else {
        message = e.message || JSON.stringify(e)
      }
      console.log('error message: ', message)
      throw new Error('Request error: ' + message)
    }
  }

  s9Url (server: S9Server | S9BuilderWith<'versionInstalled'>, path: string): string {
    const zeroconfService = this.serverModel.getZeroconf(server.id)
    if (!zeroconfService) { throw new Error('S9 Server not found on LAN') }
    const host = getLanIP(zeroconfService)
    return `http://${host}/v${server.versionInstalled.charAt(0)}${path}`
  }
}

function appendAuthOptions (server: S9Server | S9BuilderWith<'privkey'>, httpOptions: HttpOptions): HttpOptions  {
  const past = Math.floor((new Date().getTime() - 30000) / 1000)
  const tokenPayload = { 'iss': 'start9-companion', 'iat': past, 'exp': past + 60 }
  const token = new TokenSigner('ES256K', server.privkey).sign(tokenPayload)

  let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()
  headers = headers.set('Authorization', 'Bearer ' + token)
  httpOptions.headers = headers

  return httpOptions
}

function appendDefaultOptions (httpOptions: HttpOptions): HttpOptions {
  let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()
  headers = headers.set('app-version', APP_VERSION)
  httpOptions.headers = headers
  httpOptions.observe = 'response'

  return httpOptions
}

export interface HttpOptions {
  params?: { [key: string]: string | undefined }
  headers?: HttpHeaders
  body?: any // for DELETE requests only
  responseType?: 'json' | 'text'
  observe?: 'response'
}