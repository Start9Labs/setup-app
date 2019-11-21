import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableApp, AppHealthStatus } from '../models/s9-app'
import { S9Server } from '../models/s9-server'
import { Lan } from '../types/api-types'
import { S9BuilderWith } from './setup.service'

@Injectable({
  providedIn: 'root',
})
export class ServerService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getServer (server: S9Server | S9BuilderWith<'zeroconfService' | 'privkey'>): Promise<Lan.GetServerRes> {
    // @TODO remove
    return mockServerRes
    // return this.httpService.authServerRequest<Lan.GetServerRes>(server, Method.get, '')
  }

  async getAvailableApps (server: S9Server): Promise<AvailableApp[]> {
    // @TODO remove
    return [mockAvailableApp, mockAvailableApp, mockAvailableApp]
    // return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.get, 'apps/available')
  }

  async getApp (server: S9Server, appId: string): Promise<AvailableApp> {
    // @TODO remove
    return mockAvailableApp
    // return this.httpService.authServerRequest(server, Method.get, `apps/${appId}`)
  }

  async getInstalledApps (server: S9Server): Promise<InstalledApp[]> {
    // @TODO remove
    return [mockInstalledApp, mockInstalledApp]
    // return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.get, `apps/installed`)
  }

  async install (server: S9Server, app: AvailableApp): Promise<InstalledApp> {
    // @TODO remove
    const installed = mockInstalledApp
    // const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.post, `apps/${app.id}/install`)
    await this.s9Model.addApps(server, [installed])
    return installed
  }

  async uninstall (server: S9Server, app: AvailableApp): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.post, `apps/${app.id}/uninstall`)
    await this.s9Model.removeApp(server, app)
  }

  async start (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `apps/${app.id}/start`)
  }

  async stop (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `apps/${app.id}/stop`)
  }
}

const mockServerRes: Lan.GetServerRes = {
  version: '1.0.0',
  status: AppHealthStatus.RUNNING,
  specs: [
    {
      name: 'CPU',
      value: 'Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
    },
    {
      name: 'RAM',
      value: '4GB LPDDR4-2400 SDRAM',
    },
    {
      name: 'WiFI',
      value: '2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE',
    },
    {
      name: 'Ethernet',
      value: 'Gigabit',
    },
    {
      name: 'Disk',
      value: '512 GB Flash (280 GB available)',
    },
  ],
}

// @TODO remove
const mockAvailableApp: AvailableApp = {
  id: 'bitcoin',
  version: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
  descriptionLong: 'Bitcoin is an innovative payment network and new kind of money. Bitcoin utilizes a robust p2p network to garner decentralized consensus.',
  releaseNotes: '* Faster sync time<br />* MAST support',
  // server specific
  compatible: true,
  iconURL: 'assets/img/bitcoin_core.png',
}

// @TODO remove
const mockInstalledApp: InstalledApp = {
  id: 'bitcoin',
  version: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  torAddress: 'sample-bitcoin-tor-address',
  status: AppHealthStatus.RUNNING,
  statusAt: new Date(),
  iconURL: 'assets/img/bitcoin_core.png',
}