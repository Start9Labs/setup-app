import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Method } from '../types/enums'
import { Observable } from 'rxjs'
import { timeout, catchError } from 'rxjs/operators'
import { S9ServerLan, getLanIP, S9ServerFull, hasKeys } from '../models/s9-server'
import { TokenSigner } from 'jsontokens'
const APP_VERSION = '1.0.0'
const TIMEOUT = 3000

@Injectable()
export class HttpService {

  constructor (
    private readonly http: HttpClient,
  ) { }

  async request<T> (server: S9ServerLan | S9ServerFull, method: Method, url: string, httpOptions: HttpOptions = { }, body: any = { }): Promise<T> {
    this.setDefaultOptions(server, httpOptions) // mutates httpOptions
    const path = `http://${getLanIP(server)}/v0${url}`

    let call: () => Observable<HttpEvent<T>>
    switch (method) {
      case Method.get:
        call = () => this.http.get<T>(path, httpOptions as any)
        break
      case Method.post:
        call = () => this.http.post<T>(path, body, httpOptions as any)
        break
      case Method.patch:
        call = () => this.http.patch<T>(path, body, httpOptions as any)
        break
      case Method.delete:
        call = () => this.http.delete<T>(path, httpOptions as any)
        break
      default: // makes tsc happy
          call = () => this.http.get<T>(path, httpOptions as any)
    }

    try {
      const response = await call()
        .pipe(
          timeout(TIMEOUT),
          catchError(() => {
            throw new Error(`request timed out after ${TIMEOUT / 1000} seconds`)
          }),
        )
        .toPromise()
      if (response.type === HttpEventType.Response) {
        return response.body as T
      } else {
        throw new Error(`Expected HTTP Event Type, got ${response.type}`)
      }
    } catch (e) {
      const error: HttpErrorResponse = e
      const message = error.error || error
      throw new Error(message)
    }
  }

  private setDefaultOptions (server: S9ServerLan | S9ServerFull, httpOptions: HttpOptions) {
    let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()
    // always set app-version
    headers = headers.set('app-version', APP_VERSION)
    // set Authorization if hasKeys
    if (hasKeys(server)) {
      const tokenPayload = { 'iss': 'start9-companion', 'exp': new Date(new Date().getTime() + 3000) }
      const token = new TokenSigner('ES256K', server.privkey).sign(tokenPayload)
      headers = headers.set('Authorization', 'Bearer ' + token)
    }
    // finalize options
    httpOptions.headers = headers
    httpOptions.observe = 'response'
  }
}

export interface HttpOptions {
  params?: { [key: string]: string }
  headers?: HttpHeaders
  responseType?: 'json' | 'text'
  observe?: 'response'
}