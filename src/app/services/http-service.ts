import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Method } from '../../types/enums'
import { Observable } from 'rxjs'

const APP_VERSION = '1.0.0'

@Injectable()
export class HttpService {

  constructor (
    public http: HttpClient,
  ) { }

  async request<T> (method: Method, url: string, httpOptions: HttpOptions = { }, body: any = { }): Promise<T> {

      this.setDefaultOptions(httpOptions) // mutates httpOptions

      let call: () => Observable<HttpEvent<T>>
    switch (method) {
      case Method.get:
        call = () => this.http.get<T>(url, httpOptions as any)
        break
      case Method.post:
        call = () => this.http.post<T>(url, body, httpOptions as any)
        break
      case Method.patch:
        call = () => this.http.patch<T>(url, body, httpOptions as any)
        break
      case Method.delete:
        call = () => this.http.delete<T>(url, httpOptions as any)
        break
    }

    try {
      const response = await call().toPromise()
      if (response.type === HttpEventType.Response) {
        return response.body as T
      }
    } catch (e) {
      const error: HttpErrorResponse = e
      const message = error.error
      throw new Error(message)
    }
  }

  private setDefaultOptions (httpOptions: HttpOptions) {
    let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()
    headers = headers.set('APP-VERSION', APP_VERSION)
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