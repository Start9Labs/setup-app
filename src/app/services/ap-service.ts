import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService } from './http-service'

@Injectable()
export class APService {
  private readonly url = 'http://192.168.12.1/v0'

  constructor (
    public httpService: HttpService,
  ) { }

  async getTorAddress (): Promise<string> {
    return this.httpService.request(Method.get, this.url + '/tor')
  }

  async submitWifiCredentials (ssid: string, password: string): Promise<void> {
    return this.httpService.request(Method.post, this.url + '/wifi', undefined, {
      ssid,
      password,
    })
  }

  async enableWifi (ssid: string): Promise<void> {
    return this.httpService.request(Method.post, this.url + '/wifi/enable', undefined, {
      ssid,
    })
  }
}