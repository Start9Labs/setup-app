import { Injectable } from '@angular/core'
import { HttpClient, HttpEventType, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http'
import { AppSettings } from '../app/app.module'
import { Storage } from '@ionic/storage'
import { Method } from '../types/enums'
import { Observable } from 'rxjs/Observable'
import { MeStore } from '../builders/me'
import { JwtHelperService } from '@auth0/angular-jwt'
import 'rxjs/add/operator/toPromise'
import { SessionDirective } from '../components/session'
import { Platform, LoadingController } from '@ionic/angular'

@Injectable()
export class NodeService {
  API_VERSION = AppSettings.API_VERSION
  loader: HTMLIonLoadingElement // do we want to block the screen
  jwtHelper = new JwtHelperService()

  constructor (
    public platform: Platform,
    public http: HttpClient,
    public storage: Storage,
    public loadingCtrl: LoadingController,
    public session: SessionDirective
  ) { }

  async request<T> (method: Method, path: string, options: Options = { }, httpOptions: HttpOptions = { }, body: any = { }): Promise<T> {
    const { showLoader, handleError } = options

    let url: string

  
    url = `${url}/${this.API_VERSION}/${path}`

    if (showLoader && !this.loader) {
      this.loader = await this.loadingCtrl.create()
      this.loader.onWillDismiss().then(() => { this.loader = undefined })
      await this.loader.present()
    }

    let headers: HttpHeaders = httpOptions.headers || new HttpHeaders()
    headers = headers.set('APP-VERSION', AppSettings.APP_VERSION)
    httpOptions.headers = headers
    httpOptions.observe = 'response'

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
      if (response.type === HttpEventType.Response || response.type === HttpEventType.ResponseHeader) {
        const token = response.headers.get('TOKEN')
        if (token) {
          await this.storage.set('token', token)
          this.me.device_id = this.jwtHelper.decodeToken(token).device_id
        }
        if (response.type === HttpEventType.Response) {
          return response.body
        }
      }
    } catch (e) {
      const error: HttpErrorResponse = e
      const message = error.error
      if (error.status === 426) {
        await this.presentAlertOutdated(error.statusText, message)
      } else if (error.status === 401) {
        await this.storage.clear()
        await this.app.getRootNav().setRoot('WelcomePage')
        throw new Error(message)
      } else if (handleError) {
        await this.handleError(message)
      } else {
        console.error(message)
        throw new Error(message)
      }
    } finally {
      if (loader && this.loading) {
        this.loading.dismiss()
      }
    }
  }

	private async handleError (message: string): Promise<void> {
    if (this.toast) { return }

    this.toast = this.toastCtrl.create({
      message: `${message}`,
      position: 'top',
      showCloseButton: true,
      duration: 2000,
    })
    this.toast.onWillDismiss(() => {
      this.toast = undefined
    })
    await this.toast.present()
  }

  private async presentAlertOutdated (title: string, message: string) {
    let alert = this.alertCtrl.create({
      title,
      message,
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.appStore()
          },
        },
      ],
    })
    await alert.present()
  }

  private appStore () {
    if (this.platform.is('ios')) {
      window.open('https://itunes.apple.com/us/app/workblast-shift-trading/id992910656?mt=8', '_system')
    } else if (this.platform.is('android')) {
      window.open('https://play.google.com/store/apps/details?id=com.getworkblast.android.app&hl=en', '_system')
    } else {
      console.log('Browser')
    }
  }
}

export interface HttpOptions {
  params?: { [key: string]: string }
  headers?: HttpHeaders
  responseType?: 'json' | 'text'
  observe?: 'response'
}

export interface Options {
  showLoader?: boolean
  handleError?: boolean
}