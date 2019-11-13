import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableApp, initAppStatus, toS9AgentApp } from '../models/s9-app'
import { S9Server } from '../models/s9-server'

@Injectable()
export class AppService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getApp (server: S9Server, appId: string): Promise<AvailableApp> {
    return mockApp
    // return this.httpService.authServerRequest(server, Method.get, `/apps/${appId}`)
  }

  async getInstalledApps (server: S9Server) : Promise<InstalledApp[]> {
    return [mockInstalledApp(), mockInstalledApp()]
  }

  async install (server: S9Server, app: AvailableApp) {
    // @TODO remove and install the app for real

    const installed = mockInstalledApp()
    this.s9Model.addApps(server, [installed])
    return installed
  }

  async uninstall (server: S9Server, app: AvailableApp) {
    // await new S9HttpService(this.httpService, server).authRequest(Method.post, `/apps/${app.id}/uninstall`)
    this.s9Model.removeApp(server, app)
  }

  async start (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/start`)
  }

  async stop (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/stop`)
  }

  async getAvailableApps (server: S9Server): Promise<AvailableApp[]> {
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

function mockInstalledApp (): InstalledApp { return {
  id: 'bitcoin',
  versionInstalled: 0.18,
  title: 'Bitcoin',
  torAddress: 'sample-bitcoin-tor-address',
  lastStatus: initAppStatus().status,
}}