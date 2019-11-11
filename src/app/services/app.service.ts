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

  async getApp (server: S9ServerFull, appId: string): Promise<AvailableApp> {
    return mockApp
    // return this.httpService.request<Lan.PostInstallAppRes>(server, Method.get, `/apps/${appId}`)
  }

  async install (server: S9ServerFull, app: AvailableApp) {
    // @TODO remove
    const installed = {
      id: 'bitcoin',
      versionInstalled: 0.18,
      title: 'Bitcoin',
      torAddress: 'sample-bitcoin-tor-address',
      lastStatus: initAppStatus(),
    }
    // const installed = await this.httpService.request<Lan.PostInstallAppRes>(server, Method.post, `/apps/${app.id}/install`)
    this.s9Model.addApp(server, installed)
    return installed
  }

  async uninstall (server: S9ServerFull, app: AvailableApp) {
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
    return [mockApp, mockApp, mockApp]
    // return this.httpService.request<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/available')
  }
}

const mockApp = {
  id: 'bitcoin',
  version: 0.18,
  title: 'Bitcoin Core',
  descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
  descriptionLong: 'Bitcoin is an innovative payment network and new kind of money. Bitcoin utilizes a robust p2p network to garner decentralized consensus.',
  releaseNotes: '* Faster sync time<br />* MAST support',
  // server specific
  versionInstalled: 0.18,
  installed: true,
  compatible: true,
}