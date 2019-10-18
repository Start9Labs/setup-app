import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http'
import { Storage } from '@ionic/storage'
import { Method } from '../../types/enums'
import { SessionStore } from '../components/session'
import { Platform, LoadingController } from '@ionic/angular'
import { APP_VERSION } from 'src/app/app.module'
import { Observable } from 'rxjs'

@Injectable()
export class HttpService {
  loader: HTMLIonLoadingElement // do we want to block the screen
  rootUrl = 'http://192.168.12.1/v0'

  constructor (
    public platform: Platform,
    public http: HttpClient,
    public storage: Storage,
    public loadingCtrl: LoadingController,
    public session: SessionStore,
  ) { }

  withRootUrl (rootUrl : string): HttpService {
    return Object.assign(this, { rootUrl })
  }

  async submitWifiCredentials (ssid: string, password: string): Promise<void> {
    return await this.request(Method.post, 'wifi', true, undefined, {
      ssid,
      password,
    })
  }

  async getTorAddress (): Promise<{ torAddress: string}> {
    return this.request(Method.get, 'tor', false)
  }

  private async request<T> (method: Method, path: string, showLoader: boolean = false, httpOptions: HttpOptions = { }, body: any = { }): Promise<T> {
    const url = `${this.rootUrl}/${path}`

    if (showLoader && !this.loader) {
      this.loader = await this.loadingCtrl.create()
      this.loader.onWillDismiss().then(() => { this.loader = undefined })
      await this.loader.present()
    }

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
        return response.body
      }
    } catch (e) {
      const error: HttpErrorResponse = e
      const message = error.error
      console.error(message)
      throw new Error(message)
    } finally {
      if (showLoader && this.loader) {
        this.loader.dismiss()
      }
    }
  }

  setDefaultOptions (httpOptions: HttpOptions) {
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