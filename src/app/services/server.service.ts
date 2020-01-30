import { Injectable } from '@angular/core'
import { Method } from '../types/enums'
import { AppInstalled, AppAvailablePreview, AppAvailableFull, AppStatus, AppConfigSpec, AppModel, Rules } from '../models/app-model'
import { S9Notification, SSHFingerprint, ServerStatus } from '../models/server-model'
import { Lan, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled, ApiServer, ApiAppVersionInfo } from '../types/api-types'
import { S9BuilderWith } from './setup.service'
import * as configUtil from '../util/config.util'
import { pauseFor } from '../util/misc.util'
import { HttpNativeService } from './http-native.service'

@Injectable({
  providedIn: 'root',
})
export class XServerService {
  constructor (
    private readonly httpService: HttpNativeService,
    private readonly appModel: AppModel,
  ) { }

  async getServer (serverId: string): Promise<ApiServer> {
    return this.httpService.authServerRequest<Lan.GetServerRes>(serverId, '', { method: Method.get })
  }

  async getServerSpecs (serverId: string): Promise<Lan.GetServerSpecsRes> {
    return this.httpService.authServerRequest<Lan.GetServerSpecsRes>(serverId, `/specs`, { method: Method.get })
  }

  async getServerMetrics (serverId: string): Promise<Lan.GetServerMetricsRes> {
    return this.httpService.authServerRequest<Lan.GetServerMetricsRes>(serverId, `/metrics`, { method: Method.get })
  }

  async getNotifications (serverId: string, page: number, perPage: number): Promise<S9Notification[]> {
    const params: Lan.GetNotificationsReq = {
      page: String(page),
      perPage: String(perPage),
    }
    return this.httpService.authServerRequest<Lan.GetNotificationsRes>(serverId, `/notifications`, { method: Method.get, params })
  }

  async deleteNotification (serverId: string, id: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.DeleteNotificationRes>(serverId, `/notifications/${id}`, { method: Method.delete })
  }

  async updateAgent (serverId: string, version: string): Promise<void> {
    const data: Lan.PostUpdateAgentReq = {
      version,
    }
    await this.httpService.authServerRequest<Lan.PostUpdateAgentRes>(serverId, '/update', { method: Method.post, data })
  }

  async getAvailableApps (serverId: string): Promise<AppAvailablePreview[]> {
    return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(serverId, '/apps/store', { method: Method.get })
  }

  async getAvailableApp (serverId: string, appId: string): Promise<AppAvailableFull> {
    return this.httpService.authServerRequest<Lan.GetAppAvailableRes>(serverId, `/apps/${appId}/store`, { method: Method.get })
      .then(res => {
        return {
          ...res,
          versionViewing: res.versionLatest,
        }
      })
  }

  async getAvailableAppVersionInfo (serverId: string, appId: string, version: string): Promise<{ releaseNotes: string, versionViewing: string }> {
    return this.httpService.authServerRequest<Lan.GetAppAvailableVersionInfoRes>(serverId, `/apps/${appId}/store/${version}`, { method: Method.get })
      .then(res => {
        return {
          ...res,
          versionViewing: version,
        }
      })
  }

  async getInstalledApp (serverId: string, appId: string): Promise<AppInstalled> {
    return this.httpService.authServerRequest<Lan.GetAppInstalledRes>(serverId, `/apps/${appId}/installed`, { method: Method.get })
  }

  async getInstalledApps (serverId: string): Promise<AppInstalled[]> {
    return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(serverId, `/apps/installed`, { method: Method.get })
  }

  async getAppConfig (serverId: string, appId: string): Promise<{
    spec: AppConfigSpec,
    config: object
    rules: Rules[]
  }> {
    return this.httpService.authServerRequest<Lan.GetAppConfigRes>(serverId, `/apps/${appId}/config`, { method: Method.get })
      .then(({ spec, config, rules }) => {
        return {
          spec,
          config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
          rules,
        }
      })
  }

  async getAppLogs (serverId: string, appId: string, params: Lan.GetAppLogsReq = { }): Promise<string[]> {
    return this.httpService.authServerRequest<Lan.GetAppLogsRes>(serverId, `/apps/${appId}/logs`, { method: Method.get, params: params as any })
  }

  async installApp (serverId: string, appId: string, version: string): Promise<AppInstalled> {
    const data: Lan.PostInstallAppReq = {
      version,
    }
    const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(serverId, `/apps/${appId}/install`, { method: Method.post, data })
    await this.appModel.create(serverId, installed)
    return installed
  }

  async uninstallApp (serverId: string, appId: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(serverId, `/apps/${appId}/uninstall`, { method: Method.post })
    await this.appModel.remove(serverId, appId)
  }

  async startApp (serverId: string, app: AppInstalled): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostStartAppRes>(serverId, `/apps/${app.id}/start`, { method: Method.post })
    this.appModel.update(serverId, app.id, { status: AppStatus.RUNNING, statusAt: new Date().toISOString() })
  }

  async stopApp (serverId: string, app: AppInstalled): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostStopAppRes>(serverId, `/apps/${app.id}/stop`, { method: Method.post })
    this.appModel.update(serverId, app.id, { status: AppStatus.STOPPED, statusAt: new Date().toISOString() })
  }

  async updateAppConfig (serverId: string, app: AppInstalled, config: object): Promise<void> {
    const data: Lan.PostUpdateAppConfigReq = {
      config,
    }
    await this.httpService.authServerRequest<Lan.PostUpdateAppConfigRes>(serverId, `/apps/${app.id}/config`, { method: Method.patch, data })
  }

  async wipeAppData (serverId: string, app: AppInstalled): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostWipeAppDataRes>(serverId, `/apps/${app.id}/wipe`, { method: Method.post })
    this.appModel.update(serverId, app.id, { status: AppStatus.NEEDS_CONFIG, statusAt: new Date().toISOString() })
  }

  async getSSHKeys (serverId: string): Promise<SSHFingerprint[]> {
    return this.httpService.authServerRequest<Lan.GetSSHKeysRes>(serverId, `/sshKeys`, { method: Method.get })
  }

  async addSSHKey (serverId: string, sshKey: string): Promise<SSHFingerprint> {
    const data: Lan.PostAddSSHKeyReq = {
      sshKey,
    }
    return this.httpService.authServerRequest<Lan.PostAddSSHKeyRes>(serverId, `/sshKeys`, { method: Method.post, data })
  }

  async getWifi (serverId: string): Promise<string[]> {
    return this.httpService.authServerRequest<Lan.GetWifiRes>(serverId, `/wifi`, { method: Method.get })
  }

  async addWifi (serverId: string, ssid: string, password: string): Promise<void> {
    const data: Lan.PostAddWifiReq = {
      ssid,
      password,
    }
    await this.httpService.authServerRequest<Lan.PostAddWifiRes>(serverId, `/wifi`, { method: Method.post, data })
  }

  async updateWifi (serverId: string, ssid: string, password: string): Promise<void> {
    const data: Lan.PatchWifiReq = {
      password,
    }
    await this.httpService.authServerRequest<Lan.PatchWifiRes>(serverId, `/wifi/${ssid}`, { method: Method.patch, data })
  }

  async deleteWifi (serverId: string, ssid: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.DeleteWifiRes>(serverId, `/wifi/${ssid}`, { method: Method.delete })
  }

  async deleteSSHKey (serverId: string, sshKey: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.DeleteSSHKeyRes>(serverId, `/sshKeys/${sshKey}`, { method: Method.delete })
  }

  async restartServer (serverId: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostRestartServerRes>(serverId, '/restart', { method: Method.post })
  }

  async shutdownServer (serverId: string): Promise<void> {
    await this.httpService.authServerRequest<Lan.PostShutdownServerRes>(serverId, '/shutdown', { method: Method.post })
  }
}


// ********** MOCKS **********

@Injectable({
  providedIn: 'root',
})
export class ServerService {

  constructor (
    private readonly appModel: AppModel,
  ) { }

  async getServer (serverId: string | S9BuilderWith<'zeroconf' | 'privkey' | 'versionInstalled' | 'torAddress'>): Promise<ApiServer> {
    return mockGetServer()
  }

  async getServerSpecs (serverId: string): Promise<Lan.GetServerSpecsRes> {
    return mockGetServerSpecs()
  }

  async getServerMetrics (serverId: string): Promise<Lan.GetServerMetricsRes> {
    return mockGetServerMetrics()
  }

  async getNotifications (serverId: string, page: number, perPage: number): Promise<S9Notification[]> {
    return mockGetNotifications()
  }

  async deleteNotification (serverId: string, id: string): Promise<void> {
    await mockDeleteNotification()
  }

  async updateAgent (serverId: string, thing: any): Promise<void> {
    await mockPostUpdateAgent()
  }

  async getAvailableApps (serverId: string): Promise<AppAvailablePreview[]> {
    return mockGetAvailableApps()
  }

  async getAvailableApp (serverId: string, appId: string): Promise<AppAvailableFull> {
    return mockGetAvailableApp()
      .then(res => {
        return {
          ...res,
          versionViewing: res.versionLatest,
        }
      })
  }

  async getAvailableAppVersionInfo (serverId: string, appId: string, version: string): Promise<{ releaseNotes: string, versionViewing: string }> {
    return mockGetAvailableAppVersionInfo()
      .then(res => {
        return {
          ...res,
          versionViewing: version,
        }
      })
  }

  async getInstalledApp (serverId: string, appId: string): Promise<AppInstalled> {
    return mockGetInstalledApp()
  }

  async getInstalledApps (serverId: string): Promise<AppInstalled[]> {
    return mockGetInstalledApps()
  }

  async getAppConfig (serverId: string, appId: string): Promise<{
    spec: AppConfigSpec,
    config: object
    rules: Rules[]
  }> {
    return mockGetAppConfig()
      .then(({ spec, config, rules }) => {
        return {
          spec,
          config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
          rules,
        }
      })
  }

  async getAppLogs (serverId: string, appId: string, params: Lan.GetAppLogsReq = { }): Promise<string[]> {
    return mockGetAppLogs()
  }

  async installApp (serverId: string, appId: string, version: string): Promise<AppInstalled> {
    const installed = await mockInstallApp()
    await this.appModel.create(serverId, installed)
    return installed
  }

  async uninstallApp (serverId: string, appId: string): Promise<void> {
    await mockUninstallApp()
    await this.appModel.remove(serverId, appId)
  }

  async startApp (serverId: string, app: AppInstalled): Promise<void> {
    await mockStartApp()
    app.status = AppStatus.RUNNING
    app.statusAt = new Date().toISOString()
  }

  async stopApp (serverId: string, app: AppInstalled): Promise<void> {
    await mockStopApp()
  }

  async updateAppConfig (serverId: string, app: AppInstalled, config: object): Promise<void> {
    await mockUpdateAppConfig()
  }

  async wipeAppData (serverId: string, app: AppInstalled): Promise<void> {
    await mockWipeAppData()
  }

  async getSSHKeys (serverId: string): Promise<SSHFingerprint[]> {
    return mockGetSSHKeys()
  }

  async addSSHKey (serverId: string, sshKey: string): Promise<SSHFingerprint> {
    return mockAddSSHKey()
  }

  async deleteSSHKey (serverId: string, sshKey: string): Promise<void> {
    await mockDeleteSSHKey()
  }

  async getWifi (serverId: string): Promise<string[]> {
    return mockGetWifi()
  }

  async addWifi (serverId: string, ssid: string, password: string): Promise<void> {
    await mockAddWifi()
  }

  async updateWifi (serverId: string, ssid: string, password: string): Promise<void> {
    await mockUpdateWifi()
  }

  async deleteWifi (serverId: string, ssid: string): Promise<void> {
    await mockDeleteWifi()
  }

  async restartServer (serverId: string): Promise<void> {
    await mockRestartServer()
  }

  async shutdownServer (serverId: string): Promise<void> {
    await mockShutdownServer()
  }
}

// @TODO move-to-test-folders
async function mockGetServer (): Promise<Lan.GetServerRes> {
  await pauseFor(1000)
  return mockApiServer
}

// @TODO move-to-test-folders
async function mockGetServerSpecs (): Promise<Lan.GetServerSpecsRes> {
  await pauseFor(1000)
  return mockApiServerSpecs
}

// @TODO move-to-test-folders
async function mockGetServerMetrics (): Promise<Lan.GetServerMetricsRes> {
  await pauseFor(1000)
  return mockApiServerMetrics
}

// @TODO move-to-test-folders
async function mockGetNotifications (): Promise<Lan.GetNotificationsRes> {
  await pauseFor(1000)
  return mockApiNotifications.concat(mockApiNotifications).concat(mockApiNotifications)
}

// @TODO move-to-test-folders
async function mockDeleteNotification (): Promise<Lan.DeleteNotificationRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockPostUpdateAgent (): Promise<Lan.PostUpdateAgentRes> {
  await pauseFor(1000)
  return { }
}


// @TODO move-to-test-folders
async function mockGetAvailableApp (): Promise<Lan.GetAppAvailableRes> {
  await pauseFor(1000)
  return mockApiAppAvailableFull
}

// @TODO move-to-test-folders
async function mockGetAvailableApps (): Promise<Lan.GetAppsAvailableRes> {
  await pauseFor(1000)
  return mockApiAppsAvailablePreview
}

// @TODO move-to-test-folders
async function mockGetAvailableAppVersionInfo (): Promise<Lan.GetAppAvailableVersionInfoRes> {
  await pauseFor(1000)
  return mockApiAppAvailableVersionInfo
}

// @TODO move-to-test-folders
async function mockGetInstalledApp (): Promise<Lan.GetAppInstalledRes> {
  await pauseFor(1000)
  return mockApiAppsInstalled[0]
}

// @TODO move-to-test-folders
async function mockGetInstalledApps (): Promise<Lan.GetAppsInstalledRes> {
  await pauseFor(1000)
  return mockApiAppsInstalled
}

// @TODO move-to-test-folders
async function mockGetAppLogs (): Promise<Lan.GetAppLogsRes> {
  await pauseFor(1000)
  return mockApiAppLogs
}

// @TODO move-to-test-folders
async function mockGetAppConfig (): Promise<Lan.GetAppConfigRes> {
  await pauseFor(1000)
  return mockApiAppConfig
}

// @TODO move-to-test-folders
async function mockInstallApp (): Promise<Lan.PostInstallAppRes> {
  await pauseFor(1000)
  return mockApiAppsInstalled[0]
}

// @TODO move-to-test-folders
async function mockUninstallApp (): Promise<Lan.PostUninstallAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockStartApp (): Promise<Lan.PostStartAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockStopApp (): Promise<Lan.PostStopAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockUpdateAppConfig (): Promise<Lan.PostUpdateAppConfigRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockWipeAppData (): Promise<Lan.PostWipeAppDataRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockGetSSHKeys (): Promise<SSHFingerprint[]> {
  await pauseFor(1000)
  return mockApiSSHFingerprints
}

// @TODO move-to-test-folders
async function mockAddSSHKey (): Promise<SSHFingerprint> {
  await pauseFor(1000)
  return mockApiSSHFingerprints[0]
}

// @TODO move-to-test-folders
async function mockDeleteSSHKey (): Promise<Lan.DeleteSSHKeyRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockGetWifi (): Promise<string[]> {
  await pauseFor(1000)
  return ['Goosers', 'Atlantic_City']
}

async function mockAddWifi (): Promise<Lan.PostAddWifiRes> {
  await pauseFor(1000)
  return { }
}

async function mockUpdateWifi (): Promise<Lan.PatchWifiRes> {
  await pauseFor(1000)
  return { }
}

async function mockDeleteWifi (): Promise<Lan.DeleteWifiRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockRestartServer (): Promise<Lan.PostRestartServerRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockShutdownServer (): Promise<Lan.PostShutdownServerRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
const mockApiServer: Lan.GetServerRes = {
  versionInstalled: '0.1.0',
  versionLatest: '0.1.0',
  status: ServerStatus.RUNNING,
  notifications: [
    // {
    //   id: '123e4567-e89b-12d3-a456-426655440000',
    //   appId: 'bitcoind',
    //   createdAt: '2019-12-26T14:20:30.872Z',
    //   code: '101',
    //   title: 'Install Complete',
    //   message: 'Installation of bitcoind has successfully completed.',
    // },
  ],
}

const mockApiServerMetrics: Lan.GetServerMetricsRes = {
  'Group1': {
    'Metric1': {
      value: 22.2,
      unit: 'mi/b',
    },
    'Metric2': {
      value: 50,
      unit: '%',
    },
    'Metric3': {
      value: 10.1,
      unit: '%',
    },
  },
  'Group2': {
    'Hmmmm1': {
      value: 22.2,
      unit: 'mi/b',
    },
    'Hmmmm2': {
      value: 50,
      unit: '%',
    },
    'Hmmmm3': {
      value: 10.1,
      unit: '%',
    },
  },
}

const mockApiServerSpecs: Lan.GetServerSpecsRes = {
  'Model': 'S0',
  'Tor Address': 'nfsnjkcnaskjnlkasnfa.onion',
  'CPU': 'Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
  'RAM': '4GB LPDDR4-2400 SDRAM',
  'WiFI': '2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE',
  'Ethernet': 'Gigabit',
  'Disk': '512 GB Flash (280 GB available)',
}

// @TODO move-to-test-folders
const mockApiNotifications: Lan.GetNotificationsRes = [
  {
    id: '123e4567-e89b-12d3-a456-426655440000',
    appId: 'bitcoind',
    createdAt: '2019-12-26T14:20:30.872Z',
    code: '101',
    title: 'Install Complete',
    message: 'Installation of bitcoind has completed successfully.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440001',
    appId: 'bitcoind',
    createdAt: '2019-12-26T14:20:30.872Z',
    code: '201',
    title: 'SSH Key Added',
    message: 'A new SSH key was added. If you did not do this, shit is bad.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440002',
    appId: 'bitcoind',
    createdAt: '2019-12-26T14:20:30.872Z',
    code: '002',
    title: 'SSH Key Removed',
    message: 'A SSH key was removed.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440003',
    appId: 'bitcoind',
    createdAt: '2019-12-26T14:20:30.872Z',
    code: '310',
    title: 'App Crashed',
    message: 'Bitcoind has crashed',
  },
]

// @TODO move-to-test-folders
const mockApiAppsAvailablePreview: ApiAppAvailablePreview[] = [
  {
    id: 'bitcoind',
    versionLatest: '0.19.0',
    versionInstalled: '0.19.0',
    status: AppStatus.UNKNOWN,
    statusAt: new Date().toISOString(),
    title: 'Bitcoin Core',
    descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
    // server specific
    iconURL: 'assets/img/bitcoin_core.png',
  },
  {
    id: 'cups',
    versionLatest: '0.1.0',
    versionInstalled: '0.1.0',
    status: AppStatus.UNKNOWN,
    statusAt: new Date().toISOString(),
    title: 'Cups Messenger',
    descriptionShort: 'P2P encrypted messaging over Tor.',
    // server specific
    iconURL: 'assets/img/cups.png',
  },
  {
    id: 'uptime',
    versionLatest: '0.1.0',
    versionInstalled: null,
    status: AppStatus.UNKNOWN,
    statusAt: new Date().toISOString(),
    title: 'Uptime Friends',
    descriptionShort: `Perform automatic health checks for your and your friend's servers.`,
    // server specific
    iconURL: 'assets/img/uptime.png',
  },
]

// @TODO move-to-test-folders
const mockApiAppAvailableFull: ApiAppAvailableFull = {
  ...mockApiAppsAvailablePreview[0],
  versionInstalled: null,
  releaseNotes: 'Segit and more cool things!',
  descriptionLong: 'Bitcoin is an innovative payment network and new kind of money. Bitcoin utilizes a robust p2p network to garner decentralized consensus.',
  versions: ['0.19.0', '0.18.1', '0.17.0'],
}

// @TODO move-to-test-folders
const mockApiAppAvailableVersionInfo: ApiAppVersionInfo = {
  releaseNotes: 'Some older release notes that are not super important anymore.',
}

// @TODO move-to-test-folders
const mockApiAppsInstalled: ApiAppInstalled[] = [
  {
    id: 'bitcoind',
    versionLatest: '0.19.0',
    versionInstalled: '0.18.1',
    title: 'Bitcoin Core',
    torAddress: 'sample-bitcoin-tor-address.onion',
    status: AppStatus.RUNNING,
    statusAt: new Date().toISOString(),
    iconURL: 'assets/img/bitcoin_core.png',
  },
  {
    id: 'cups',
    versionLatest: '0.1.0',
    versionInstalled: '0.1.0',
    title: 'Cups Messenger',
    torAddress: 'sample-cups-tor-address.onion',
    status: AppStatus.NEEDS_CONFIG,
    statusAt: new Date().toISOString(),
    iconURL: 'assets/img/cups.png',
  },
]

// @TODO move-to-test-folders
const mockApiAppLogs: string[] = [
  '****** START *****',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:20:30.872Z - Hash: 2b2e5abb3cba2164aea0',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1244ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:21:01.685Z - Hash: bb3f5d0e11f2cd2dd57b',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1185ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:23:13.812Z - Hash: 9342e11e6b8e16ad2f70',
  '[ng] 114 unchanged chunks',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:20:30.872Z - Hash: 2b2e5abb3cba2164aea0',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1244ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:21:01.685Z - Hash: bb3f5d0e11f2cd2dd57b',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1185ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:23:13.812Z - Hash: 9342e11e6b8e16ad2f70',
  '[ng] 114 unchanged chunks',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:20:30.872Z - Hash: 2b2e5abb3cba2164aea0',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1244ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:21:01.685Z - Hash: bb3f5d0e11f2cd2dd57b',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1185ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:23:13.812Z - Hash: 9342e11e6b8e16ad2f70',
  '[ng] 114 unchanged chunks',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:20:30.872Z - Hash: 2b2e5abb3cba2164aea0',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1244ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:21:01.685Z - Hash: bb3f5d0e11f2cd2dd57b',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1185ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:23:13.812Z - Hash: 9342e11e6b8e16ad2f70',
  '[ng] 114 unchanged chunks',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:20:30.872Z - Hash: 2b2e5abb3cba2164aea0',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1244ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:21:01.685Z - Hash: bb3f5d0e11f2cd2dd57b',
  '[ng] 114 unchanged chunks',
  '[ng] chunk {app-logs-app-logs-module} app-logs-app-logs-module.js, app-logs-app-logs-module.js.map (app-logs-app-logs-module) 7.86 kB  [rendered]',
  '[ng] Time: 1185ms',
  '[ng] ℹ ｢wdm｣: Compiled successfully.',
  '[ng] ℹ ｢wdm｣: Compiling...',
  '[ng] Date: 2019-12-26T14:23:13.812Z - Hash: 9342e11e6b8e16ad2f70',
  '[ng] 114 unchanged chunks',
  '****** FINISH *****',
]

const mockApiSSHFingerprints: SSHFingerprint[] = [
  {
    alg: 'ed25519',
    hash: '12:f8:7e:78:61:b4:bf:e2:de:24:15:96:4e:d4:72:53',
    hostname: 'matt macbook pro',
  },
  {
    alg: 'ed25519',
    hash: '12:f8:7e:78:61:b4:bf:e2:de:24:15:96:4e:d4:72:53',
    hostname: 'matt macbook pro',
  },
]

const mockApiAppConfig: Lan.GetAppConfigRes = {
  // config spec
  spec: {
    randomEnum: {
      name: 'Random Enum',
      type: 'enum',
      default: 'null',
      description: 'This is not even real.',
      changeWarning: 'Be careful chnaging this!',
      values: ['null', 'option1', 'option2', 'option3'],
    },
    testnet: {
      name: 'Testnet',
      type: 'boolean',
      description: 'determines whether your node is running ontestnet or mainnet',
      changeWarning: 'Chain will have to resync!',
      default: false,
    },
    favoriteNumber: {
      name: 'Favorite Number',
      type: 'number',
      integral: false,
      description: 'Your favorite number of all time',
      changeWarning: 'Once you set this number, it can never be changed without severe consequences.',
      nullable: false,
      default: 7,
      range: '(-100,100]',
    },
    secondaryNumbers: {
      name: 'Unlucky Numbers',
      type: 'list',
      description: 'Numbers that you like but are not your top favorite.',
      spec: {
        type: 'number',
        integral: false,
        range: '[-100,200)',
      },
      range: '[0,10]',
      default: [2, 3],
    },
    rpcsettings: {
      name: 'RPC Settings',
      type: 'object',
      description: 'rpc username and password',
      changeWarning: 'Adding RPC users gives them special permissions on your node.',
      nullable: false,
      nullByDefault: false,
      spec: {
        laws: {
          name: 'Laws',
          type: 'object',
          description: 'the law of the realm',
          nullable: true,
          nullByDefault: true,
          spec: {
            law1: {
              name: 'First Law',
              type: 'string',
              description: 'the first law',
              nullable: true,
            },
            law2: {
              name: 'Second Law',
              type: 'string',
              description: 'the second law',
              nullable: true,
            },
          },
        },
        rulemakers: {
          name: 'Rule Makers',
          type: 'list',
          description: 'the people who make the rules',
          range: '[0,2]',
          default: [],
          spec: {
            type: 'object',
            spec: {
              rulemakername: {
                name: 'Rulemaker Name',
                type: 'string',
                description: 'the name of the rule maker',
                nullable: false,
                default: {
                  charset: 'a-g,2-9',
                  len: 12,
                },
              },
              rulemakerip: {
                name: 'Rulemaker IP',
                type: 'string',
                description: 'the ip of the rule maker',
                nullable: false,
                default: '192.168.1.0',
                pattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
                patternDescription: 'may only contain numbers and periods',
              },
            },
          },
        },
        rpcuser: {
          name: 'RPC Username',
          type: 'string',
          description: 'rpc username',
          nullable: false,
          default: 'defaultrpcusername',
          pattern: '^[a-zA-Z]+$',
          patternDescription: 'must contain only letters.',
        },
        rpcpass: {
          name: 'RPC User Password',
          type: 'string',
          description: 'rpc password',
          nullable: false,
          default: {
            charset: 'a-z,A-Z,2-9',
            len: 20,
          },
        },
      },
    },
    advanced: {
      name: 'Advanced',
      type: 'object',
      description: 'Advanced settings',
      nullable: false,
      nullByDefault: false,
      spec: {
        notifications: {
          name: 'Notification Preferences',
          type: 'list',
          description: 'how you want to be notified',
          range: '[1,3]',
          default: ['email'],
          spec: {
            type: 'enum',
            values: ['email', 'text', 'call', 'push', 'webhook'],
          },
        },
      },
    },
    port: {
      name: 'Port',
      type: 'number',
      integral: true,
      description: 'the default port for your Bitcoin node. default: 8333, testnet: 18333, regtest: 18444',
      nullable: false,
      default: 8333,
      range: '[0, 9999]',
    },
    maxconnections: {
      name: 'Max Connections',
      type: 'string',
      description: 'the maximum number of commections allowed to your Bitcoin node',
      nullable: true,
    },
    rpcallowip: {
      name: 'RPC Allowed IPs',
      type: 'list',
      description: 'external ip addresses that are authorized to access your Bitcoin node',
      changeWarning: 'Any IP you allow here will have RPC access to your Bitcoin node.',
      range: '[1,10]',
      default: ['192.168.1.1'],
      spec: {
        type: 'string',
        pattern: '((^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)|(^[a-z2-7]{16}\\.onion$)|(^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$))',
        patternDescription: 'must be a valid ipv4, ipv6, or domain name',
      },
    },
    rpcauth: {
      name: 'RPC Auth',
      type: 'list',
      description: 'api keys that are authorized to access your Bitcoin node.',
      range: '[0,*)',
      default: [],
      spec: {
        type: 'string',
      },
    },
  },
  // actual config
  config: {
    randomEnum: 'option1',
    favoriteNumber: 8,
    testnet: true,
    rpcuserpass: undefined,
    notifications: ['email', 'text'],
    port: 5959,
    maxconnections: null,
    rpcallowip: [],
    rpcauth: ['matt: 8273gr8qwoidm1uid91jeh8y23gdio1kskmwejkdnm'],
  },
  rules: [],
}