import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { AvailableApp, Lan } from '../types/api-types'
import { Method } from '../types/enums'
import { getLanIP, S9ServerFull } from '../models/s9-server'

@Injectable()
export class AppService {

  constructor (
    private readonly httpService: HttpService,
  ) { }

  async install (name: string) {
    await this.httpService.request<Lan.PostInstallAppRes>(Method.post, '/apps/install', { }, { name })
  }

  async uninstall (name: string) {
    await this.httpService.request<Lan.PostUninstallAppRes>(Method.post, '/apps/uninstall', { }, { name })
  }

}