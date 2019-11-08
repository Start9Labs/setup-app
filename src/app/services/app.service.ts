import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Lan } from '../types/api-types'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableApp, initAppStatus } from '../models/installed-app'
import { S9Server } from '../models/s9-server'

@Injectable()
export class AppService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async install (server: S9Server, availableApp: AvailableApp) {
    const installed = {
      id: 'bitcoin',
      displayName: 'Bitcoin',
      torAddress: 'sample-bitcoin-tor-address',
      lastStatus: initAppStatus(),
    }
    // const installed = await this.httpService.request<Lan.PostInstallAppRes>(Method.post, '/apps/install', { }, { id: availableApp.id })
    this.s9Model.addApp(server, installed)
    return installed
  }

  async uninstall (server: S9Server, app: InstalledApp) {
    // await this.httpService.request<Lan.PostUninstallAppRes>(Method.post, '/apps/uninstall', { }, { name })
    this.s9Model.removeApp(server, app)
  }

  async getAvailableApps (): Promise<AvailableApp[]> {
    return [
      {
        id: 'bitcoin',
        displayName: 'Bitcoin',
      },
    ]
    // return this.httpService.request<Lan.GetAppsAvailableRes>(Method.get, '/apps/available')
  }

}