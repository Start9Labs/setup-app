import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { InstalledApp, AvailableAppFull, AppHealthStatus, AvailableAppPreview } from '../models/s9-app'
import { S9Server, toS9AgentApp } from '../models/s9-server'
import { Lan, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled } from '../types/api-types'
import { S9BuilderWith } from './setup.service'

@Injectable({
  providedIn: 'root',
})
export class ServerService {

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getServer (server: S9Server | S9BuilderWith<'zeroconfService' | 'privkey' | 'versionInstalled'>): Promise<Lan.GetServerRes & { statusAt: Date }> {
    // @TODO remove
    // return mockGetServer()
    return this.httpService.authServerRequest<Lan.GetServerRes>(server, Method.get, '')
      .then(res => {
        return {
          ...res,
          statusAt: new Date(),
        }
      })
  }

  async getAvailableApps (server: S9Server): Promise<AvailableAppPreview[]> {
    // @TODO remove
    // return mockGetAvailableApps()
    return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/available')
  }

  async getAvailableApp (server: S9Server, appId: string): Promise<AvailableAppFull> {
    // @TODO remove
    // return mockGetAvailableApp()
    return this.httpService.authServerRequest<Lan.GetAppAvailableRes>(server, Method.get, `/apps/available/${appId}`)
      .then(res => {
        return {
          ...res,
          releaseNotes: res.versions.find(v => v.version === res.versionLatest)!.releaseNotes,
        }
      })
  }

  async getInstalledApps (server: S9Server): Promise<InstalledApp[]> {
    // @TODO remove
    // return mockGetInstalledApps()
    return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.get, `/apps/installed`)
      .then(res => {
        const apps = res.map(mapApiInstalledApp)
        apps.unshift(toS9AgentApp(server))
        return apps
      })
  }

  async install (server: S9Server, appId: string, version: string): Promise<InstalledApp> {
    const body: Lan.PostInstallAppReq = {
      id: appId,
      version,
    }
    // @TODO remove
    // const installed = await mockPostInstallApp()
    const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.post, `/apps/install`, { }, body)
      .then(mapApiInstalledApp)
    await this.s9Model.addApp(server, installed)
    return installed
  }

  async uninstall (server: S9Server, appId: string): Promise<void> {
    const body: Lan.PostUninstallAppReq = {
      id: appId,
    }
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.post, `/apps/uninstall`, { }, body)
    await this.s9Model.removeApp(server, appId)
  }

  async start (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/start`)
  }

  async stop (server: S9Server, app: InstalledApp): Promise<InstalledApp> {
    return this.httpService.authServerRequest(server, Method.post, `/apps/${app.id}/stop`)
  }
}

function mapApiInstalledApp (app: ApiAppInstalled): InstalledApp {
  return {
    ...app,
    statusAt: new Date(),
  }
}

// @TODO remove
async function mockGetServer (): Promise<Lan.GetServerRes> {
  return mockApiServer
}

// @TODO remove
async function mockGetAvailableApp (): Promise<Lan.GetAppAvailableRes> {
  return mockApiAppAvailableFull
}

// @TODO remove
async function mockGetAvailableApps (): Promise<Lan.GetAppsAvailableRes> {
  return [mockApiAppAvailablePreview, mockApiAppAvailablePreview, mockApiAppAvailablePreview]
}

// @TODO remove
async function mockGetInstalledApps (): Promise<Lan.GetAppsInstalledRes> {
  return [mockInstalledApiApp]
}

// @TODO remove
async function mockPostInstallApp (): Promise<Lan.PostInstallAppRes> {
  return mockInstalledApiApp
}

// @TODO remove
const mockApiServer: Lan.GetServerRes = {
  versionInstalled: '0.1.0',
  versionLatest: '0.1.0',
  status: AppHealthStatus.RUNNING,
  specs: {
    'CPU': 'Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
    'RAM': '4GB LPDDR4-2400 SDRAM',
    'WiFI': '2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE',
    'Ethernet': 'Gigabit',
    'Disk': '512 GB Flash (280 GB available)',
  },
}

// @TODO remove
const mockApiAppAvailablePreview: ApiAppAvailablePreview = {
  id: 'bitcoin',
  versionLatest: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
  // server specific
  iconURL: 'assets/img/bitcoin_core.png',
}

// @TODO remove
const mockApiAppAvailableFull: ApiAppAvailableFull = {
  ...mockApiAppAvailablePreview,
  descriptionLong: 'Bitcoin is an innovative payment network and new kind of money. Bitcoin utilizes a robust p2p network to garner decentralized consensus.',
  versions: [
    {
      version: '0.17.0',
      releaseNotes: '* Faster sync time<br />* MAST support',
    },
    {
      version: '0.16.0',
      releaseNotes: '* New Bitcoiny stuff!!',
    },
  ],
}

// @TODO remove
const mockInstalledApiApp: ApiAppInstalled = {
  id: 'bitcoin',
  versionLatest: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  torAddress: 'sample-bitcoin-tor-address',
  status: AppHealthStatus.RUNNING,
  iconURL: 'assets/img/bitcoin_core.png',
}