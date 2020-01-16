import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { AppInstalled, AppAvailablePreview, AppAvailableFull, AppHealthStatus, AppConfigSpec, AppModel, Rules } from '../models/app-model'
import { S9Server, S9Notification } from '../models/server-model'
import { Lan, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled, ApiServer } from '../types/api-types'
import { S9BuilderWith } from './setup.service'
import * as configUtil from '../util/config.util'
import { pauseFor } from '../util/misc.util'

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  constructor (
    private readonly httpService: HttpService,
    private readonly appModel: AppModel,
  ) { }

  async getServer (server: S9Server | S9BuilderWith<'zeroconf' | 'privkey' | 'versionInstalled' | 'torAddress'>): Promise<ApiServer> {
    // @TODO remove
    // return mockGetServer()
    return this.httpService.authServerRequest<Lan.GetServerRes>(server, Method.GET, '')
  }

  async getNotifications (server: S9Server, page: number, perPage: number): Promise<S9Notification[]> {
    const params: Lan.GetNotificationsReq = {
      page: String(page),
      perPage: String(perPage),
    }
    // @TODO remove
    // return mockGetNotifications()
    return this.httpService.authServerRequest<Lan.GetNotificationsRes>(server, Method.GET, `/notifications`, { params })
  }

  async deleteNotification (server: S9Server, id: string): Promise<void> {
    const body: Lan.DeleteNotificationReq = {
      id,
    }
    // @TODO remove
    // await mockDeleteNotification()
    await this.httpService.authServerRequest<Lan.DeleteNotificationRes>(server, Method.DELETE, `/notifications`, { body })
  }

  async updateAgent (server: S9Server): Promise<void> {
    const body: Lan.PostUpdateAgentReq = {
      version: server.versionLatest,
    }
    // @TODO remove
    // await mockPostUpdateAgent()
    await this.httpService.authServerRequest<Lan.PostUpdateAgentRes>(server, Method.POST, '/update', { }, body)
  }

  async getAvailableApps (server: S9Server): Promise<AppAvailablePreview[]> {
    // @TODO remove
    // return mockGetAvailableApps()
    return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.GET, '/apps/store')
  }

  async getAvailableApp (server: S9Server, appId: string): Promise<AppAvailableFull> {
    // @TODO remove
    // return mockGetAvailableApp()
    return this.httpService.authServerRequest<Lan.GetAppAvailableRes>(server, Method.GET, `/apps/${appId}/store`)
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
    return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.GET, `/apps/installed`)
      .then(res => res.map(mapApiInstalledApp))
  }

  async getAppConfig (server: S9Server, appId: string): Promise<{
    spec: AppConfigSpec,
    config: object
    rules: Rules[]
  }> {
    // @TODO remove
    // return mockGetAppConfig()
    return this.httpService.authServerRequest<Lan.GetAppConfigRes>(server, Method.GET, `/apps/${appId}/config`)
      .then(({ spec, config, rules }) => {
        return {
          spec,
          config: configUtil.mapSpecToConfigObject({ type: 'object', spec }, config || { }),
          rules,
        }
      })
  }

  async getAppLogs (server: S9Server, appId: string, params: Lan.GetAppLogsReq = { }): Promise<string[]> {
    // @TODO remove
    // return mockGetAppLogs()
    return this.httpService.authServerRequest<Lan.GetAppLogsRes>(server, Method.GET, `/apps/${appId}/logs`, { params })
  }

  async installApp (server: S9Server, appId: string, version: string): Promise<AppInstalled> {
    const body: Lan.PostInstallAppReq = {
      version,
    }
    // @TODO remove
    // const installed = await mockInstallApp()
    const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.POST, `/apps/${appId}/install`, { }, body, 240000)
      .then(mapApiInstalledApp)
    await this.appModel.cacheApp(server.id, installed)
    return installed
  }

  async uninstallApp (server: S9Server, appId: string): Promise<void> {
    // @TODO remove
    // await mockUninstallApp()
    await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.POST, `/apps/${appId}/uninstall`)
    await this.appModel.removeApp(server.id, appId)
  }

  async startApp (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockStartApp()
    await this.httpService.authServerRequest<Lan.PostStartAppRes>(server, Method.POST, `/apps/${app.id}/start`)
    app.status = AppHealthStatus.RUNNING
    app.statusAt = new Date()
  }

  async stopApp (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockStopApp()
    await this.httpService.authServerRequest<Lan.PostStopAppRes>(server, Method.POST, `/apps/${app.id}/stop`)
    app.status = AppHealthStatus.STOPPED
    app.statusAt = new Date()
  }

  async updateAppConfig (server: S9Server, app: AppInstalled, config: object): Promise<void> {
    const body: Lan.PostUpdateAppConfigReq = {
      config,
    }
    // @TODO remove
    // await mockUpdateAppConfig()
    await this.httpService.authServerRequest<Lan.PostUpdateAppConfigRes>(server, Method.PATCH, `/apps/${app.id}/config`, { }, body)
  }

  async wipeAppData (server: S9Server, app: AppInstalled): Promise<void> {
    // @TODO remove
    // await mockWipeAppData()
    await this.httpService.authServerRequest<Lan.PostWipeAppDataRes>(server, Method.POST, `/apps/${app.id}/wipe`)
    app.status = AppHealthStatus.NEEDS_CONFIG
    app.statusAt = new Date()
  }

  async getSSHKeys (server: S9Server): Promise<string[]> {
    // @TODO remove
    return mockGetSSHKeys()
    // return this.httpService.authServerRequest<Lan.GetSSHKeysRes>(server, Method.GET, `/sshKeys`)
  }

  async addSSHKey (server: S9Server, sshKey: string): Promise<string> {
    const body: Lan.PostAddSSHKeyReq = {
      sshKey,
    }
    // @TODO remove
    // return mockAddSSHKey()
    return this.httpService.authServerRequest<Lan.PostAddSSHKeyRes>(server, Method.POST, `/sshKeys`, { }, body)
  }

  async deleteSSHKey (server: S9Server, sshKey: string): Promise<void> {
    const body: Lan.DeleteSSHKeyReq = {
      sshKey,
    }
    // @TODO remove
    // await mockDeleteSSHKey()
    await this.httpService.authServerRequest<Lan.DeleteSSHKeyRes>(server, Method.DELETE, `/sshKeys`, { body })
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
  await pauseFor(1000)
  return mockApiServer
}

// @TODO remove
async function mockGetNotifications (): Promise<Lan.GetNotificationsRes> {
  await pauseFor(1000)
  return mockApiNotifications.concat(mockApiNotifications).concat(mockApiNotifications)
}

// @TODO remove
async function mockDeleteNotification (): Promise<Lan.DeleteNotificationRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockPostUpdateAgent (): Promise<Lan.PostUpdateAgentRes> {
  await pauseFor(1000)
  return { }
}


// @TODO remove
async function mockGetAvailableApp (): Promise<Lan.GetAppAvailableRes> {
  await pauseFor(1000)
  return mockApiAppAvailableFull
}

// @TODO remove
async function mockGetAvailableApps (): Promise<Lan.GetAppsAvailableRes> {
  await pauseFor(1000)
  return [mockApiAppAvailablePreview, mockApiAppAvailablePreview, mockApiAppAvailablePreview]
}

// @TODO remove
async function mockGetInstalledApps (): Promise<Lan.GetAppsInstalledRes> {
  await pauseFor(1000)
  return [mockApiAppInstalled]
}

// @TODO remove
async function mockGetAppLogs (): Promise<Lan.GetAppLogsRes> {
  await pauseFor(1000)
  return mockApiAppLogs
}

// @TODO remove
async function mockGetAppConfig (): Promise<Lan.GetAppConfigRes> {
  await pauseFor(1000)
  return mockApiAppConfig
}

// @TODO remove
async function mockInstallApp (): Promise<Lan.PostInstallAppRes> {
  await pauseFor(1000)
  return mockApiAppInstalled
}

// @TODO remove
async function mockUninstallApp (): Promise<Lan.PostUninstallAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockStartApp (): Promise<Lan.PostStartAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockStopApp (): Promise<Lan.PostStopAppRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockUpdateAppConfig (): Promise<Lan.PostUpdateAppConfigRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockWipeAppData (): Promise<Lan.PostWipeAppDataRes> {
  await pauseFor(1000)
  return { }
}

// @TODO remove
async function mockGetSSHKeys (): Promise<Lan.GetSSHKeysRes> {
  await pauseFor(1000)
  return mockApiSSHKeys
}

// @TODO remove
async function mockAddSSHKey (): Promise<Lan.PostAddSSHKeyRes> {
  await pauseFor(1000)
  return mockApiSSHKeys[0]
}

// @TODO remove
async function mockDeleteSSHKey (): Promise<Lan.DeleteSSHKeyRes> {
  await pauseFor(1000)
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
  notifications: [  {
    id: '123e4567-e89b-12d3-a456-426655440000',
    appId: 'bitcoind',
    created_at: '2019-12-26T14:20:30.872Z',
    code: '101',
    title: 'Install Complete',
    message: 'Installation of bitcoind has successfully completed.',
  }],
}

// @TODO remove
const mockApiNotifications: Lan.GetNotificationsRes = [
  {
    id: '123e4567-e89b-12d3-a456-426655440000',
    appId: 'bitcoind',
    created_at: '2019-12-26T14:20:30.872Z',
    code: '101',
    title: 'Install Complete',
    message: 'Installation of bitcoind has completed successfully.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440001',
    appId: 'start9-agent',
    created_at: '2019-12-26T14:20:30.872Z',
    code: '201',
    title: 'SSH Key Added',
    message: 'A new SSH key was added. If you did not do this, shit is bad.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440002',
    appId: 'start9-agent',
    created_at: '2019-12-26T14:20:30.872Z',
    code: '002',
    title: 'SSH Key Removed',
    message: 'A SSH key was removed.',
  },
  {
    id: '123e4567-e89b-12d3-a456-426655440003',
    appId: 'bitcoind',
    created_at: '2019-12-26T14:20:30.872Z',
    code: '310',
    title: 'App Crashed',
    message: 'Bitcoind has crashed',
  },
]

// @TODO remove
const mockApiAppAvailablePreview: ApiAppAvailablePreview = {
  id: 'bitcoind',
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
  id: 'bitcoind',
  versionLatest: '0.18.1',
  versionInstalled: '0.18.1',
  title: 'Bitcoin Core',
  torAddress: 'sample-bitcoin-tor-address',
  status: AppHealthStatus.RECOVERABLE,
  iconURL: 'assets/img/bitcoin_core.png',
}

// @TODO remove
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

const mockApiSSHKeys = [
  '12:f8:7e:78:61:b4:bf:e2:de:24:15:96:4e:d4:72:53',
  '00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff',
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
    favoriteNumber: {
      type: 'number',
      description: 'Your favorite number of all time',
      nullable: false,
      default: 7,
      range: '(-100,100]',
    },
    secondaryNumbers: {
      type: 'list',
      description: 'Numbers that you like but are not your top favorite.',
      spec: {
        type: 'number',
        range: '[-100,200)',
      },
      range: '[0,10]',
      default: [2, 3],
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
          range: '[0,2]',
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
                  len: 12,
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
            len: 20,
          },
        },
      },
    },
    notifications: {
      type: 'list',
      description: 'how you want to be notified',
      range: '[1,3]',
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
      range: '[1,10]',
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
    testnet: true,
    rpcuserpass: undefined,
    notifications: ['email', 'text'],
    port: '8333',
    maxconnections: null,
    rpcallowip: [],
    rpcauth: ['matt: 8273gr8qwoidm1uid91jeh8y23gdio1kskmwejkdnm'],
  },
  rules: [],
}