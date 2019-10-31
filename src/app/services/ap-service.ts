import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService } from './http-service'
import { Ap } from '../../types/api-types'

@Injectable()
export class APService {
  private readonly url = 'http://192.168.12.1/v0'

  constructor (
    public httpService: HttpService,
  ) { }

  async getTorAddress (): Promise<string> {
    return this.httpService.request<Ap.GetTorRes>(Method.get, this.url + '/tor').then(r => r.torAddress)
  }

  async submitWifiCredentials (body: Ap.PostSubmitWifiReq): Promise<Ap.PostSubmitWifiRes> {
    return this.httpService.request(Method.post, this.url + '/wifi', undefined, body)
  }

  async enableWifi (body: Ap.PostEnableWifiReq): Promise<Ap.PostEnableWifiRes> {
    return this.httpService.request(Method.post, this.url + '/wifi/enable', undefined, body)
  }
}