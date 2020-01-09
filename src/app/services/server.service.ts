import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel } from '../models/server-model'
import { AppInstalled, AppAvailablePreview, AppAvailableFull, AppHealthStatus, AppConfigSpec } from '../models/s9-app'
import { S9Server } from '../models/s9-server'
import { Lan, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled } from '../types/api-types'
import { S9BuilderWith } from './setup.service'
import * as configUtil from '../util/config.util'

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getServer (server: S9Server | S9BuilderWith<'zeroconfService' | 'privkey' | 'versionInstalled' | 'torAddress'>): Promise<S9Server> {
    // @TODO remove
    // return mockGetServer()
    return this.httpService.authServerRequest<Lan.GetServerRes>(server, Method.get, '')
      .then(res => {
        return {
          updating: false,
          apps: [],
          ...server,
          ...res,
          statusAt: new Date(),
        }
      })
  }

  async updateAgent (server: S9Server): Promise<void> {
    const body: Lan.PostUpdateAgentReq = {
      version: server.versionLatest,
    }
    // @TODO remove
    // await mockPostUpdateAgent()
    await this.httpService.authServerRequest<Lan.PostUpdateAgentRes>(server, Method.post, '/update', { }, body)
  }

  async getAvailableApps (server: S9Server): Promise<AppAvailablePreview[]> {
    // @TODO remove
    // return mockGetAvailableApps()
    return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/store')
  }

  async getAvailableApp (server: S9Server, appId: string): Promise<AppAvailableFull> {
    // @TODO remove
    // return mockGetAvailableApp()
    return this.httpService.authServerRequest<Lan.GetAppAvailableRes>(server, Method.get, `/apps/${appId}/store`)
      .then(res => {
        return {
          ...res,
          // versionLatest expected to have a corresponding version, hence bang
          releaseNotes: res.versions.find(v => v.version === res.versionLatest)!.releaseNotes,
        }
      })
  }

  async getInstalledApps (server: S9Server): Promise<AppInstalled[]> {
    // @TODO remove
    // return mockGetInstalledApps()
    return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.get, `/apps/installed`)
      .then(res => res.map(mapApiInstalledApp))
  }

  async getAppConfig (server: S9Server, appId: string): Promise<{ spec: AppConfigSpec, config: object }> {
    // @TODO remove
    // return mockGetAppConfig()
    return this.httpService.authServerRequest<Lan.GetAppConfigRes>(server, Method.get, `/apps/${appId}/config`)
      .then(({ spec, config }) => {
        return {
          spec,
          config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
        }
      })
  }

  async getAppLogs (server: S9Server, appId: string, params: Lan.GetAppLogsReq = { }): Promise<string[]> {
    // @TODO remove
    // return mockGetAppLogs()
    return this.httpService.authServerRequest<Lan.GetAppLogsRes>(server, Method.get, `/apps/${appId}/logs`, { params })
  }

  async installApp (server: S9Server, appId: string, version: string): Promise<AppInstalled> {
    const body: Lan.PostInstallAppReq = {
      version,
    }
    // @TODO remove
    // const installed = await mockInstallApp()
    const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.post, `/apps/${appId}/install`, { }, body, 240000)
      .then(mapApiInstalledApp)
    await this.s9Model.cacheApp(server.id, installed)
    return installed
  }

  async uninstallApp (server: S9Server, appId: string): Promise<void> {
    // @TODO remove
    // await mockUninstallApp()
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.post, `/apps/${appId}/uninstall`)
    await this.s9Model.removeApp(server.id, appId)
  }

  async startApp (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockStartApp()
    await this.httpService.authServerRequest<Lan.PostStartAppRes>(server, Method.post, `/apps/${app.id}/start`)
    app.status = AppHealthStatus.RUNNING
    app.statusAt = new Date()
  }

  async stopApp (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockStopApp()
    await this.httpService.authServerRequest<Lan.PostStopAppRes>(server, Method.post, `/apps/${app.id}/stop`)
    app.status = AppHealthStatus.STOPPED
    app.statusAt = new Date()
  }

  async updateAppConfig (server: S9Server, app: AppInstalled, config: object): Promise<void> {
    const body: Lan.PostUpdateAppConfigReq = {
      config,
    }
    // @TODO remove
    // await mockUpdateAppConfig()
    await this.httpService.authServerRequest<Lan.PostUpdateAppConfigRes>(server, Method.patch, `/apps/${app.id}/config`, { }, body)
  }

  async wipeAppData (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockWipeAppData()
    await this.httpService.authServerRequest<Lan.PostWipeAppDataRes>(server, Method.post, `/apps/${app.id}/wipe`)
    app.status = AppHealthStatus.NEEDS_CONFIG
    app.statusAt = new Date()
  }

  async addSSHKey (server: S9Server, key: string): Promise<void> {
    const body: Lan.PostAddSSHKeyReq = {
      key,
    }
    // @TODO remove
    // await mockAddSSHKey()
    await this.httpService.authServerRequest<Lan.PostAddSSHKeyRes>(server, Method.post, `/server/${server.id}/sshKeys`, { }, body)
  }

  async removeSSHKey (server: S9Server, key: string): Promise<void> {
    const body: Lan.PostRemoveSSHKeyReq = {
      key,
    }
    // @TODO remove
    // await mockRemoveSSHKey()
    await this.httpService.authServerRequest<Lan.PostRemoveSSHKeyRes>(server, Method.delete, `/server/${server.id}/sshKeys`, { }, body)
  }
}

function mapApiInstalledApp (app: ApiAppInstalled): AppInstalled {
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
async function mockPostUpdateAgent (): Promise<Lan.PostUpdateAgentRes> {
  return { }
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
  return [mockApiAppInstalled]
}

// @TODO remove
async function mockGetAppLogs (): Promise<Lan.GetAppLogsRes> {
  return mockApiAppLogs
}

// @TODO remove
async function mockGetAppConfig (): Promise<Lan.GetAppConfigRes> {
  return mockApiAppConfig
}

// @TODO remove
async function mockInstallApp (): Promise<Lan.PostInstallAppRes> {
  return mockApiAppInstalled
}

// @TODO remove
async function mockUninstallApp (): Promise<Lan.PostUninstallAppRes> {
  return { }
}

// @TODO remove
async function mockStartApp (): Promise<Lan.PostStartAppRes> {
  return { }
}

// @TODO remove
async function mockStopApp (): Promise<Lan.PostStopAppRes> {
  return { }
}

// @TODO remove
async function mockUpdateAppConfig (): Promise<Lan.PostUpdateAppConfigRes> {
  return { }
}

// @TODO remove
async function mockWipeAppData (): Promise<Lan.PostWipeAppDataRes> {
  return { }
}

// @TODO remove
async function mockAddSSHKey (): Promise<Lan.PostAddSSHKeyRes> {
  return { }
}

// @TODO remove
async function mockRemoveSSHKey (): Promise<Lan.PostRemoveSSHKeyRes> {
  return { }
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
  sshKeys: [],
  events: [],
}

// @TODO remove
const mockApiAppAvailablePreview: ApiAppAvailablePreview = {
  id: 'bitcoin',
  versionLatest: '0.18.1',
  versionInstalled: undefined,
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
      version: '0.18.1',
      releaseNotes: '* Faster sync time<br />* MAST support',
    },
    {
      version: '0.17.0',
      releaseNotes: '* New Bitcoiny stuff!!',
    },
  ],
}

// @TODO remove
const mockApiAppInstalled: ApiAppInstalled = {
  id: 'bitcoin',
  versionLatest: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  torAddress: 'sample-bitcoin-tor-address',
  status: AppHealthStatus.RECOVERABLE,
  iconURL: 'assets/img/bitcoin_core.png',
}

// @TODO remove
const mockApiAppLogs: string[] = [
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
]

const mockApiAppConfig: Lan.GetAppConfigRes = {
  // config spec
  spec: {
    randomEnum: {
      type: 'enum',
      description: 'This is not even real.',
      nullable: true,
      values: ['option1', 'option2', 'option3'],
    },
    testnet: {
      type: 'boolean',
      description: 'determines whether your node is running ontestnet or mainnet',
      default: false,
    },
    rpcuserpass: {
      type: 'object',
      description: 'rpc username and password',
      nullable: false,
      spec: {
        rules: {
          type: 'object',
          description: 'the rules of the game',
          nullable: true,
          spec: {
            rule1: {
              type: 'string',
              description: 'the first rule',
              nullable: true,
            },
            rule2: {
              type: 'string',
              description: 'the second rule',
              nullable: true,
            },
          },
        },
        rulemakers: {
          type: 'list',
          description: 'the people who make the rules',
          length: '0..2',
          default: [],
          spec: {
            type: 'object',
            spec: {
              rulemakername: {
                type: 'string',
                description: 'the name of the rule maker',
                nullable: false,
                default: {
                  charset: 'a-g,2-9',
                  length: '6..12',
                },
              },
              rulemakerip: {
                type: 'string',
                description: 'the ip of the rule maker',
                nullable: false,
                default: '192.168.1.0',
                pattern: {
                  regex: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
                  description: 'may only contain numbers and periods',
                },
              },
            },
          },
        },
        rpcuser: {
          type: 'string',
          description: 'rpc username',
          nullable: false,
          // @TODO what if default charset doesn't align with regex. No protection here?
          default: 'defaultrpcusername',
          pattern: {
            regex: '^[a-zA-Z]+$',
            description: 'must contain only letters and be less than 50 characters in length.',
          },
        },
        rpcpass: {
          type: 'string',
          description: 'rpc password',
          nullable: false,
          default: {
            charset: 'a-z,A-Z,2-9',
            length: '10..50',
          },
        },
      },
    },
    notifications: {
      type: 'list',
      description: 'how you want to be notified',
      length: '1..3',
      default: ['email'],
      spec: {
        type: 'enum',
        values: ['email', 'text', 'call', 'push', 'webhook'],
      },
    },
    port: {
      type: 'string',
      description: 'the default port for your Bitcoin node. default: 8333, testnet: 18333, regtest: 18444',
      nullable: true,
      default: '8333',
    },
    maxconnections: {
      type: 'string',
      description: 'the maximum number of commections allowed to your Bitcoin node',
      nullable: true,
    },
    rpcallowip: {
      type: 'list',
      description: 'external ip addresses that are authorized to access your Bitcoin node',
      length: '1..10',
      default: ['192.168.1.1'],
      spec: {
        type: 'string',
        pattern: {
          regex: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
          description: 'may only contain numbers and periods',
        },
      },
    },
    rpcauth: {
      type: 'list',
      description: 'api keys that are authorized to access your Bitcoin node.',
      length: '0..',
      default: [],
      spec: {
        type: 'string',
      },
    },
  },
  // actual config
  config: {
    randomEnum: 'option1',
    testnet: true,
    rpcuserpass: undefined,
    notifications: ['email', 'text'],
    port: '8333',
    maxconnections: null,
    rpcallowip: [],
    rpcauth: ['matt: 8273gr8qwoidm1uid91jeh8y23gdio1kskmwejkdnm'],
  },
}