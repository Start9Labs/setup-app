import { Injectable } from '@angular/core'
import { Method } from '../types/enums'
import { AppInstalled, AppAvailablePreview, AppAvailableFull, AppStatus, AppConfigSpec, Rules } from '../models/app-model'
import { S9Notification, SSHFingerprint, ServerStatus, ServerModel, EmbassyConnection } from '../models/server-model'
import { ReqRes, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled, ApiServer, ApiAppVersionInfo } from '../types/api-types'
import { S9BuilderWith } from './setup.service'
import * as configUtil from '../util/config.util'
import { pauseFor } from '../util/misc.util'
import { ServerAppModel } from '../models/server-app-model'
import { HttpService } from './http.service'

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor (
    private readonly http: HttpService,
    private readonly appModel: ServerAppModel,
  ) { }

  async getServer (serverId: string): Promise<ApiServer> {
    return this.http.serverRequest<ReqRes.GetServerRes>(serverId, { method: Method.GET, url: '' })
  }

  async getVersionLatest (serverId: string): Promise<ReqRes.GetVersionLatestRes> {
    return this.http.serverRequest<ReqRes.GetVersionLatestRes>(serverId, { method: Method.GET, url: '/versionLatest' }, false)
  }

  async getServerSpecs (serverId: string): Promise<ReqRes.GetServerSpecsRes> {
    return this.http.serverRequest<ReqRes.GetServerSpecsRes>(serverId, { method: Method.GET, url: `/specs` })
  }

  async getServerMetrics (serverId: string): Promise<ReqRes.GetServerMetricsRes> {
    return this.http.serverRequest<ReqRes.GetServerMetricsRes>(serverId, { method: Method.GET, url: `/metrics` })
  }

  async getNotifications (serverId: string, page: number, perPage: number): Promise<S9Notification[]> {
    const params: ReqRes.GetNotificationsReq = {
      page: String(page),
      perPage: String(perPage),
    }
    return this.http.serverRequest<ReqRes.GetNotificationsRes>(serverId, { method: Method.GET, url: `/notifications`, params })
  }

  async deleteNotification (serverId: string, id: string): Promise<void> {
    await this.http.serverRequest<ReqRes.DeleteNotificationRes>(serverId, { method: Method.DELETE, url: `/notifications/${id}` })
  }

  async updateAgent (serverId: string, version: string): Promise<void> {
    const data: ReqRes.PostUpdateAgentReq = {
      version,
    }
    await this.http.serverRequest<ReqRes.PostUpdateAgentRes>(serverId, { method: Method.POST, url: '/update', data })
  }

  async getAvailableApps (serverId: string): Promise<AppAvailablePreview[]> {
    return this.http.serverRequest<ReqRes.GetAppsAvailableRes>(serverId, { method: Method.GET, url: '/apps/store' })
  }

  async getAvailableApp (serverId: string, appId: string): Promise<AppAvailableFull> {
    return this.http.serverRequest<ReqRes.GetAppAvailableRes>(serverId, { method: Method.GET, url: `/apps/${appId}/store` })
      .then(res => {
        return {
          ...res,
          versionViewing: res.versionLatest,
        }
      })
  }

  async getAvailableAppVersionInfo (serverId: string, appId: string, version: string): Promise<{ releaseNotes: string, versionViewing: string }> {
    return this.http.serverRequest<ReqRes.GetAppAvailableVersionInfoRes>(serverId, { method: Method.GET, url: `/apps/${appId}/store/${version}` })
      .then(res => {
        return {
          ...res,
          versionViewing: version,
        }
      })
  }

  async getInstalledApp (serverId: string, appId: string): Promise<AppInstalled> {
    return this.http.serverRequest<ReqRes.GetAppInstalledRes>(serverId, { method: Method.GET, url: `/apps/${appId}/installed` })
  }

  async getInstalledApps (serverId: string): Promise<AppInstalled[]> {
    const res = this.http.serverRequest<ReqRes.GetAppsInstalledRes>(serverId, { method: Method.GET, url: `/apps/installed` })
    return res
  }

  async getAppConfig (serverId: string, appId: string): Promise<{
    spec: AppConfigSpec,
    config: object
    rules: Rules[]
  }> {
    let res = await this.http.serverRequest<ReqRes.GetAppConfigRes | string>(serverId, { method: Method.GET, url: `/apps/${appId}/config` })
    // @COMPAT Ambasssador <= 0.1.3
    if (typeof res === 'string') {
      res = JSON.parse(res) as ReqRes.GetAppConfigRes
    }
    const { spec, config, rules } = res
    // END
    return {
      spec,
      config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
      rules,
    }
  }

  async getAppLogs (serverId: string, appId: string, params: ReqRes.GetAppLogsReq = { }): Promise<string[]> {
    return this.http.serverRequest<ReqRes.GetAppLogsRes>(serverId, { method: Method.GET, url: `/apps/${appId}/logs`, params: params as any })
  }

  async getAppMetrics (serverId: string, appId: string): Promise<ReqRes.GetAppMetricsRes> {
    let res = await this.http.serverRequest<ReqRes.GetAppMetricsRes | string>(serverId, { method: Method.GET, url: `/apps/${appId}/metrics` })
    // @COMPAT Ambasssador <= 0.1.3
    if (typeof res === 'string') {
      res = JSON.parse(res) as ReqRes.GetAppMetricsRes
    }
    // END
    return res
  }

  async installApp (serverId: string, appId: string, version: string): Promise<AppInstalled> {
    const data: ReqRes.PostInstallAppReq = {
      version,
    }
    return this.http.serverRequest<ReqRes.PostInstallAppRes>(serverId, { method: Method.POST, url: `/apps/${appId}/install`, data })
  }

  async uninstallApp (serverId: string, appId: string): Promise<void> {
    await this.http.serverRequest<ReqRes.PostUninstallAppRes>(serverId, { method: Method.POST, url: `/apps/${appId}/uninstall`, readTimeout: 30 })
  }

  async startApp (serverId: string, appId: string): Promise<void> {
    await this.http.serverRequest<ReqRes.PostStartAppRes>(serverId, { method: Method.POST, url: `/apps/${appId}/start`, readTimeout: 30 })
    this.appModel.get(serverId).updateApp({ id: appId, status: AppStatus.RUNNING })
  }

  async stopApp (serverId: string, appId: string): Promise<void> {
    await this.http.serverRequest<ReqRes.PostStopAppRes>(serverId, { method: Method.POST, url: `/apps/${appId}/stop`, readTimeout: 30 })
    this.appModel.get(serverId).updateApp({ id: appId, status: AppStatus.STOPPED })
  }

  async updateAppConfig (serverId: string, app: AppInstalled, config: object): Promise<void> {
    const data: ReqRes.PostUpdateAppConfigReq = {
      config,
    }
    await this.http.serverRequest<ReqRes.PostUpdateAppConfigRes>(serverId, { method: Method.PATCH, url: `/apps/${app.id}/config`, data, readTimeout: 30 })
  }

  async wipeAppData (serverId: string, app: AppInstalled): Promise<void> {
    await this.http.serverRequest<ReqRes.PostWipeAppDataRes>(serverId, { method: Method.POST, url: `/apps/${app.id}/wipe`, readTimeout: 30 })
    this.appModel.get(serverId).updateApp({ id: app.id, status: AppStatus.NEEDS_CONFIG })
  }

  async getSSHKeys (serverId: string): Promise<SSHFingerprint[]> {
    return this.http.serverRequest<ReqRes.GetSSHKeysRes>(serverId, { method: Method.GET, url: `/sshKeys` })
  }

  async addSSHKey (serverId: string, sshKey: string): Promise<SSHFingerprint> {
    const data: ReqRes.PostAddSSHKeyReq = {
      sshKey,
    }
    return this.http.serverRequest<ReqRes.PostAddSSHKeyRes>(serverId, { method: Method.POST, url: `/sshKeys`, data })
  }

  async getWifi (serverId: string, timeout?: number): Promise<ReqRes.GetWifiRes> {
    return this.http.serverRequest<ReqRes.GetWifiRes>(serverId, { method: Method.GET, url: `/wifi`, readTimeout: timeout })
  }

  async addWifi (serverId: string, ssid: string, password: string, country: string): Promise<void> {
    const data: ReqRes.PostAddWifiReq = {
      ssid,
      password,
      country,
    }
    await this.http.serverRequest<ReqRes.PostAddWifiRes>(serverId, { method: Method.POST, url: `/wifi`, data })
  }

  async connectWifi (serverId: string, ssid: string, country: string): Promise<void> {
    const params: ReqRes.PostConnectWifiReq = {
      country,
    }
    await this.http.serverRequest<ReqRes.PostConnectWifiRes>(serverId, { method: Method.POST, url: encodeURI(`/wifi/${ssid}`), params })
  }

  async deleteWifi (serverId: string, ssid: string): Promise<void> {
    await this.http.serverRequest<ReqRes.DeleteWifiRes>(serverId, { method: Method.DELETE, url: encodeURI(`/wifi/${ssid}`) })
  }

  async deleteSSHKey (serverId: string, sshKey: string): Promise<void> {
    await this.http.serverRequest<ReqRes.DeleteSSHKeyRes>(serverId, { method: Method.DELETE, url: `/sshKeys/${sshKey}` })
  }

  async restartServer (serverId: string): Promise<void> {
    await this.http.serverRequest<ReqRes.PostRestartServerRes>(serverId, { method: Method.POST, url: '/restart', readTimeout: 30 })
  }

  async shutdownServer (serverId: string): Promise<void> {
    await this.http.serverRequest<ReqRes.PostShutdownServerRes>(serverId, { method: Method.POST, url: '/shutdown', readTimeout: 30 })
  }
}


// ********** MOCKS **********

@Injectable({
  providedIn: 'root',
})
export class XApiService {

  constructor (
    private readonly serverModel: ServerModel,
    private readonly appModel: ServerAppModel,
  ) { }

  async getServer (serverId: string): Promise<ApiServer> {
    const res = await mockGetServer()
    this.setConnection(serverId)
    return res
  }

  async getVersionLatest (serverId: string): Promise<ReqRes.GetVersionLatestRes> {
    this.setConnection(serverId)
    return mockGetVersionLatest()
  }

  async getServerSpecs (serverId: string): Promise<ReqRes.GetServerSpecsRes> {
    this.setConnection(serverId)
    return mockGetServerSpecs()
  }

  async getServerMetrics (serverId: string): Promise<ReqRes.GetServerMetricsRes> {
    this.setConnection(serverId)
    return mockGetServerMetrics()
  }

  async getNotifications (serverId: string, page: number, perPage: number): Promise<S9Notification[]> {
    this.setConnection(serverId)
    return mockGetNotifications()
  }

  async deleteNotification (serverId: string, id: string): Promise<void> {
    this.setConnection(serverId)
    await mockDeleteNotification()
  }

  async updateAgent (serverId: string, thing: any): Promise<void> {
    this.setConnection(serverId)
    await mockPostUpdateAgent()
  }

  async getAvailableApps (serverId: string): Promise<AppAvailablePreview[]> {
    this.setConnection(serverId)
    return mockGetAvailableApps()
  }

  async getAvailableApp (serverId: string, appId: string): Promise<AppAvailableFull> {
    this.setConnection(serverId)
    return mockGetAvailableApp()
      .then(res => {
        return {
          ...res,
          versionViewing: res.versionLatest,
        }
      })
  }

  async getAvailableAppVersionInfo (serverId: string, appId: string, version: string): Promise<{ releaseNotes: string, versionViewing: string }> {
    this.setConnection(serverId)
    return mockGetAvailableAppVersionInfo()
      .then(res => {
        return {
          ...res,
          versionViewing: version,
        }
      })
  }

  async getInstalledApp (serverId: string, appId: string): Promise<AppInstalled> {
    this.setConnection(serverId)
    return mockGetInstalledApp()
  }

  async getAppMetrics (serverId: string, appId: string): Promise<ReqRes.GetAppMetricsRes> {
    this.setConnection(serverId)
    return mockGetAppMetrics()
  }

  async getInstalledApps (serverId: string): Promise<AppInstalled[]> {
    const res = await mockGetInstalledApps()
    this.setConnection(serverId)
    return res
  }

  async getAppConfig (serverId: string, appId: string): Promise<{
    spec: AppConfigSpec,
    config: object
    rules: Rules[]
  }> {
    this.setConnection(serverId)
    return mockGetAppConfig()
      .then(({ spec, config, rules }) => {
        return {
          spec,
          config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
          rules,
        }
      })
  }

  async getAppLogs (serverId: string, appId: string, params: ReqRes.GetAppLogsReq = { }): Promise<string[]> {
    this.setConnection(serverId)
    return mockGetAppLogs()
  }

  async installApp (serverId: string, appId: string, version: string): Promise<AppInstalled> {
    this.setConnection(serverId)
    return mockInstallApp()
  }

  async uninstallApp (serverId: string, appId: string): Promise<void> {
    this.setConnection(serverId)
    await mockUninstallApp()
  }

  async startApp (serverId: string, appId: string): Promise<void> {
    this.setConnection(serverId)
    await mockStartApp()
    this.appModel.get(serverId).updateApp({ id: appId, status: AppStatus.RUNNING })
  }

  async stopApp (serverId: string, appId: string): Promise<void> {
    this.setConnection(serverId)
    await mockStopApp()
    this.appModel.get(serverId).updateApp({ id: appId, status: AppStatus.STOPPED })
  }

  async updateAppConfig (serverId: string, app: AppInstalled, config: object): Promise<void> {
    this.setConnection(serverId)
    await mockUpdateAppConfig()
  }

  async wipeAppData (serverId: string, app: AppInstalled): Promise<void> {
    this.setConnection(serverId)
    await mockWipeAppData()
  }

  async getSSHKeys (serverId: string): Promise<SSHFingerprint[]> {
    this.setConnection(serverId)
    return mockGetSSHKeys()
  }

  async addSSHKey (serverId: string, sshKey: string): Promise<SSHFingerprint> {
    this.setConnection(serverId)
    return mockAddSSHKey()
  }

  async deleteSSHKey (serverId: string, sshKey: string): Promise<void> {
    this.setConnection(serverId)
    await mockDeleteSSHKey()
  }

  async getWifi (serverId: string, timeout = 60): Promise<ReqRes.GetWifiRes> {
    this.setConnection(serverId)
    return mockGetWifi()
  }

  async addWifi (serverId: string, ssid: string, password: string, country: string): Promise<void> {
    this.setConnection(serverId)
    await mockAddWifi()
  }

  async connectWifi (serverId: string, ssid: string, country: string): Promise<void> {
    this.setConnection(serverId)
    await mockConnectWifi()
  }

  async deleteWifi (serverId: string, ssid: string): Promise<void> {
    this.setConnection(serverId)
    await mockDeleteWifi()
  }

  async restartServer (serverId: string): Promise<void> {
    this.setConnection(serverId)
    await mockRestartServer()
  }

  async shutdownServer (serverId: string): Promise<void> {
    this.setConnection(serverId)
    await mockShutdownServer()
  }

  setConnection (serverId: string) {
    this.serverModel.updateServer(serverId, { connectionType: EmbassyConnection.LAN })
  }
}

// @TODO move-to-test-folders
async function mockGetServer (): Promise<ReqRes.GetServerRes> {
  await pauseFor(1000)
  return mockApiServer
}

async function mockGetVersionLatest (): Promise<ReqRes.GetVersionLatestRes> {
  await pauseFor(1000)
  return mockVersionLatest
}

// @TODO move-to-test-folders
async function mockGetServerSpecs (): Promise<ReqRes.GetServerSpecsRes> {
  await pauseFor(1000)
  return mockApiServerSpecs
}

// @TODO move-to-test-folders
async function mockGetServerMetrics (): Promise<ReqRes.GetServerMetricsRes> {
  await pauseFor(1000)
  return mockApiServerMetrics
}

// @TODO move-to-test-folders
async function mockGetNotifications (): Promise<ReqRes.GetNotificationsRes> {
  await pauseFor(1000)
  function cloneAndChange (arr: S9Notification[], letter: string) { return JSON.parse(JSON.stringify(arr)).map(a => { a.id = a.id + letter; return a }) }
  return mockApiNotifications.concat(cloneAndChange(mockApiNotifications, 'a')).concat(cloneAndChange(mockApiNotifications, 'b'))
}

// @TODO move-to-test-folders
async function mockDeleteNotification (): Promise<ReqRes.DeleteNotificationRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockPostUpdateAgent (): Promise<ReqRes.PostUpdateAgentRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockGetAvailableApp (): Promise<ReqRes.GetAppAvailableRes> {
  await pauseFor(1000)
  return mockApiAppAvailableFull
}

// @TODO move-to-test-folders
async function mockGetAvailableApps (): Promise<ReqRes.GetAppsAvailableRes> {
  await pauseFor(1000)
  return mockApiAppsAvailablePreview
}

// @TODO move-to-test-folders
async function mockGetAvailableAppVersionInfo (): Promise<ReqRes.GetAppAvailableVersionInfoRes> {
  await pauseFor(1000)
  return mockApiAppAvailableVersionInfo
}

// @TODO move-to-test-folders
async function mockGetInstalledApp (): Promise<ReqRes.GetAppInstalledRes> {
  await pauseFor(1000)
  return mockApiAppsInstalled[0]
}

// @TODO move-to-test-folders
async function mockGetInstalledApps (): Promise<ReqRes.GetAppsInstalledRes> {
  await pauseFor(1000)
  return mockApiAppsInstalled
}

// @TODO move-to-test-folders
async function mockGetAppLogs (): Promise<ReqRes.GetAppLogsRes> {
  await pauseFor(1000)
  return mockApiAppLogs
}

// @TODO move-to-test-folders
async function mockGetAppMetrics (): Promise<ReqRes.GetAppMetricsRes> {
  await pauseFor(1000)
  return mockApiAppMetrics
}

// @TODO move-to-test-folders
async function mockGetAppConfig (): Promise<ReqRes.GetAppConfigRes> {
  await pauseFor(1000)
  return mockApiAppConfig
}

// @TODO move-to-test-folders
async function mockInstallApp (): Promise<ReqRes.PostInstallAppRes> {
  await pauseFor(1000)
  return mockApiAppInstalledFresh
}

// @TODO move-to-test-folders
async function mockUninstallApp (): Promise<ReqRes.PostUninstallAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockStartApp (): Promise<ReqRes.PostStartAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockStopApp (): Promise<ReqRes.PostStopAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockUpdateAppConfig (): Promise<ReqRes.PostUpdateAppConfigRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockWipeAppData (): Promise<ReqRes.PostWipeAppDataRes> {
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
async function mockDeleteSSHKey (): Promise<ReqRes.DeleteSSHKeyRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockGetWifi (): Promise<ReqRes.GetWifiRes> {
  await pauseFor(1000)
  return {
    ssids: ['Goosers', 'AtReqRestic City'],
    current: 'Goosers',
  }
}

async function mockAddWifi (): Promise<ReqRes.PostAddWifiRes> {
  await pauseFor(1000)
  return { }
}

async function mockConnectWifi (): Promise<ReqRes.PostConnectWifiRes> {
  await pauseFor(1000)
  return { }
}

async function mockDeleteWifi (): Promise<ReqRes.DeleteWifiRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockRestartServer (): Promise<ReqRes.PostRestartServerRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
async function mockShutdownServer (): Promise<ReqRes.PostShutdownServerRes> {
  await pauseFor(1000)
  return { }
}

// @TODO move-to-test-folders
const mockApiNotifications: ReqRes.GetNotificationsRes = [
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
const mockApiServer: ReqRes.GetServerRes = {
  versionInstalled: '0.1.4',
  status: ServerStatus.RUNNING,
  notifications: [],
  // notifications: mockApiNotifications,
}

const mockVersionLatest: ReqRes.GetVersionLatestRes = {
  versionLatest: '0.1.4',
  canUpdate: true,
}

const mockApiServerMetrics: ReqRes.GetServerMetricsRes = {
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

const mockApiServerSpecs: ReqRes.GetServerSpecsRes = {
  'Model': 'S0',
  'Tor Address': 'nfsnjkcnaskjnlkasnfa.onion',
  'CPU': 'Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
  'RAM': '4GB LPDDR4-2400 SDRAM',
  'WiFI': '2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE',
  'Ethernet': 'Gigabit',
  'Disk': '512 GB Flash (280 GB available)',
}

// @TODO move-to-test-folders
const mockApiAppsAvailablePreview: ApiAppAvailablePreview[] = [
  {
    id: 'bitcoind',
    versionLatest: '0.19.1',
    versionInstalled: '0.19.0',
    status: AppStatus.UNKNOWN,
    title: 'Bitcoin Core',
    descriptionShort: 'Bitcoin is an innovative payment network and new kind of money.',
    iconURL: 'assets/img/bitcoin_core.png',
  },
  {
    id: 'cups',
    versionLatest: '0.1.0',
    versionInstalled: '0.1.0',
    status: AppStatus.UNKNOWN,
    title: 'Cups Messenger',
    descriptionShort: 'P2P encrypted messaging over Tor.',
    iconURL: 'assets/img/cups.png',
  },
  {
    id: 'bitwarden',
    versionLatest: '0.1.0',
    versionInstalled: null,
    status: AppStatus.UNKNOWN,
    title: 'Bitwarden',
    descriptionShort: `Self-hosted password manager`,
    iconURL: 'assets/img/bitwarden.png',
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
    versionInstalled: '0.18.1',
    title: 'Bitcoin Core',
    torAddress: 'sample-bitcoin-tor-address.onion',
    status: AppStatus.RUNNING,
    iconURL: 'assets/img/bitcoin_core.png',
  },
  {
    id: 'cups',
    versionInstalled: '0.1.0',
    title: 'Cups Messenger',
    torAddress: 'sample-cups-tor-address.onion',
    status: AppStatus.NEEDS_CONFIG,
    iconURL: 'assets/img/cups.png',
  },
]

const mockApiAppInstalledFresh: ApiAppInstalled = {
  id: 'bitcoind',
  versionInstalled: '0.19.1',
  title: 'Bitcoin Core',
  torAddress: 'sample-bitcoin-tor-address.onion',
  status: AppStatus.INSTALLING,
  iconURL: 'assets/img/bitcoin_core.png',
}

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

const mockApiAppMetrics: ReqRes.GetAppMetricsRes = {
    Metric1: 'test value',
    Metric2: 'test value 2',
}

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

const mockApiAppConfig: ReqRes.GetAppConfigRes = {
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
      subtype: 'number',
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
          subtype: 'object',
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
          subtype: 'enum',
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
      subtype: 'string',
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
      subtype: 'string',
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
