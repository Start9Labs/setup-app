import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Observable } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { getLanIP, S9Server } from '../models/server-model'
import { TokenSigner } from 'jsontokens'
import { S9BuilderWith } from './setup.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { Method } from '../types/enums'
const version = require('../../../package.json')

@Injectable({
  providedIn: 'root',
})
export class HttpBrowserService {

  constructor (
    private readonly http: HttpClient,
    private readonly zerconfDaemon: ZeroconfDaemon,
  ) { }

  async authServerRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled' | 'privkey'>,
    path: string,
    method: Method,
    options: HttpBrowserOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const authOptions = appendAuthOptions(server, options)
    return this.serverRequest(server, path, method, authOptions, body, TIMEOUT)
  }

  async serverRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled'>,
    path: string,
    method: Method,
    options: HttpBrowserOptions = { },
    body: any = { },
    TIMEOUT = 30000,
  ): Promise<T> {
    const url = this.s9Url(server, path)
    return this.request(method, url, options, body, TIMEOUT)
  }

  async request<T> (method: Method, url: string, options: HttpBrowserOptions = { }, body: any = { }, TIMEOUT = 30000): Promise<T> {
    const newOptions = appendDefaultOptions(options)
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
      console.log('request error: ', message)
      throw new Error(message)
    }
  }

  s9Url (server: S9Server | S9BuilderWith<'versionInstalled'>, path: string): string {
    const zeroconf = this.zerconfDaemon.getService(server.id)
    if (!zeroconf) { throw new Error('S9 Server not found on LAN') }
    const host = getLanIP(zeroconf)
    return `http://${host}/v${server.versionInstalled.charAt(0)}${path}`
  }
}

function appendAuthOptions (server: S9Server | S9BuilderWith<'privkey'>, options: HttpBrowserOptions): HttpBrowserOptions  {
  const past = Math.floor((new Date().getTime() - 30000) / 1000)
  const tokenPayload = { 'iss': 'start9-companion', 'iat': past, 'exp': past + 60 }
  const token = new TokenSigner('ES256K', server.privkey).sign(tokenPayload)

  let headers: HttpHeaders = options.headers || new HttpHeaders()
  headers = headers.set('Authorization', 'Bearer ' + token)
  options.headers = headers

  return options
}

function appendDefaultOptions (options: HttpBrowserOptions): HttpBrowserOptions {
  let headers: HttpHeaders = options.headers || new HttpHeaders()
  headers = headers.set('app-version', version)
  options.headers = headers
  options.observe = 'response'

  return options
}

export interface HttpBrowserOptions {
  params?: { [key: string]: string | undefined }
  headers?: HttpHeaders
  body?: any // for DELETE requests only
  responseType?: 'json' | 'text'
  observe?: 'response'
}