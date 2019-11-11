import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Lan } from '../types/api-types'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableApp, initAppStatus } from '../models/s9-app'
import { S9ServerFull } from '../models/s9-server'

@Injectable()
export class AppService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async install (server: S9ServerFull, app: AvailableApp) {
    // @TODO remove
    const installed = {
      id: 'bitcoin',
      displayName: 'Bitcoin',
      torAddress: 'sample-bitcoin-tor-address',
      lastStatus: initAppStatus(),
    }
    // const installed = await this.httpService.request<Lan.PostInstallAppRes>(server, Method.post, `/apps/${app.id}/install`)
    this.s9Model.addApp(server, installed)
    return installed
  }

  async uninstall (server: S9ServerFull, app: InstalledApp) {
    // await this.httpService.request<Lan.PostUninstallAppRes>(server, Method.post, `/apps/${app.id}/uninstall`)
    this.s9Model.removeApp(server, app)
  }

  async start (server: S9ServerFull, app: InstalledApp) {
    return this.httpService.request<Lan.PostStopAppRes>(server, Method.post, `/apps/${app.id}/start`)
  }

  async stop (server: S9ServerFull, app: InstalledApp) {
    return this.httpService.request<Lan.PostStartAppRes>(server, Method.post, `/apps/${app.id}/stop`)
  }

  async getAvailableApps (server: S9ServerFull): Promise<AvailableApp[]> {
    // @TODO remove
    return [
      {
        id: 'bitcoin',
        displayName: 'Bitcoin',
        installed: true,
      },
    ]
    // return this.httpService.request<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/available')
  }

}