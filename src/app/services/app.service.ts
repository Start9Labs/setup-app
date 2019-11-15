import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableApp, initAppStatus } from '../models/s9-app'
import { S9Server } from '../models/s9-server'
import { Lan } from '../types/api-types'

@Injectable({
  providedIn: 'root',
})
export class AppService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getAvailableApps (server: S9Server): Promise<AvailableApp[]> {
    // @TODO remove
    // return [mockAvailableApp, mockAvailableApp, mockAvailableApp]
    return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/available')
  }

  async getApp (server: S9Server, appId: string): Promise<AvailableApp> {
    // @TODO remove
    // return mockAvailableApp
    return this.httpService.authServerRequest(server, Method.get, `/apps/${appId}`)
  }

  async getInstalledApps (server: S9Server): Promise<InstalledApp[]> {
    // @TODO remove
    // return [mockInstalledApp, mockInstalledApp]
    return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.get, `/apps/installed`)
  }

  async install (server: S9Server, app: AvailableApp): Promise<InstalledApp> {
    // @TODO remove
    // const installed = mockInstalledApp()
    const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.post, `/apps/${app.id}/install`)
    await this.s9Model.addApps(server, [installed])
    return installed
  }

  async uninstall (server: S9Server, app: AvailableApp): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.post, `/apps/${app.id}/uninstall`)
    await this.s9Model.removeApp(server, app)
  }

  async start (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/start`)
  }

  async stop (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/stop`)
  }
}

// @TODO remove
const mockAvailableApp: AvailableApp = {
  id: 'bitcoin',
  version: '0.18.1',
  title: 'Bitcoin Core',
  descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
  descriptionLong: 'Bitcoin is an innovative payment network and new kind of money. Bitcoin utilizes a robust p2p network to garner decentralized consensus.',
  releaseNotes: '* Faster sync time<br />* MAST support',
  // server specific
  versionInstalled: '0.18.1',
  installed: true,
  compatible: true,
  iconURL: 'assets/img/bitcoin_core.png',
}

// @TODO remove
const mockInstalledApp: InstalledApp = {
  id: 'bitcoin',
  versionInstalled: '0.18.1',
  title: 'Bitcoin',
  torAddress: 'sample-bitcoin-tor-address',
  lastStatus: initAppStatus(),
  iconURL: 'assets/img/bitcoin_core.png',
}