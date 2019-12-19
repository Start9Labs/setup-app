import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { S9ServerModel, clone } from '../models/server-model'
import { AppInstalled, AppAvailablePreview, AppAvailableFull, AppHealthStatus, AppValueSpecList, AppConfigSpec, AppValueSpec, AppValueSpecObject, AppValueSpecString, AppValueSpecEnum, AppValueSpecBoolean } from '../models/s9-app'
import { S9Server, toS9AgentApp } from '../models/s9-server'
import { Lan, ApiAppAvailablePreview, ApiAppAvailableFull, ApiAppInstalled, ApiAppConfig } from '../types/api-types'
import { S9BuilderWith } from './setup.service'
import * as crypto from '../util/crypto.util'
const MAX_ENTROPY = 100

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  mock = true

  constructor (
    private readonly httpService: HttpService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async getServer (server: S9Server | S9BuilderWith<'zeroconfService' | 'privkey' | 'versionInstalled' | 'torAddress'>): Promise<S9Server> {
    // @TODO remove
    return mockGetServer()
    // return this.httpService.authServerRequest<Lan.GetServerRes>(server, Method.get, '')
      .then(res => {
        const toReturn = {
          updating: false,
          apps: [],
          ...server,
          ...res,
          statusAt: new Date(),
        }
        return {
          ...toReturn,
          agentApp: toS9AgentApp(toReturn),
        }
      })
  }

  async getAvailableApps (server: S9Server): Promise<AppAvailablePreview[]> {
    // @TODO remove
    return mockGetAvailableApps()
    // return this.httpService.authServerRequest<Lan.GetAppsAvailableRes>(server, Method.get, '/apps/available')
  }

  async getAvailableApp (server: S9Server, appId: string): Promise<AppAvailableFull> {
    // @TODO remove
    return mockGetAvailableApp()
    // return this.httpService.authServerRequest<Lan.GetAppAvailableRes>(server, Method.get, `/apps/available/${appId}`)
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
    return mockGetInstalledApps()
    // return this.httpService.authServerRequest<Lan.GetAppsInstalledRes>(server, Method.get, `/apps/installed`)
      .then(res => res.map(mapApiInstalledApp))
  }

  async getAppConfig (server: S9Server, appId: string): Promise<{ spec: AppConfigSpec, config: object }> {
    // @TODO remove
    return mockGetAppConfig()
    // return this.httpService.authServerRequest<Lan.GetAppConfigRes>(server, Method.get, `/apps/installed/${appId}/config`)
      .then(({ spec, config }) => {
        return {
          spec,
          config: mapSpecToConfigObject({ type: 'object', nullable: false, spec }, config || { }),
        }
      })
  }

  async installApp (server: S9Server, appId: string, version: string): Promise<AppInstalled> {
    const body: Lan.PostInstallAppReq = {
      id: appId,
      version,
    }
    // @TODO remove
    const installed = await mockInstallApp()
    // const installed = await this.httpService.authServerRequest<Lan.PostInstallAppRes>(server, Method.post, `/apps/install`, { }, body, 240000)
      .then(mapApiInstalledApp)
    await this.s9Model.addApp(server, installed)
    return installed
  }

  async uninstallApp (server: S9Server, appId: string): Promise<void> {
    const body: Lan.PostUninstallAppReq = {
      id: appId,
    }
    // @TODO remove
    await mockUninstallApp()
    // await this.httpService.authServerRequest<Lan.PostUninstallAppRes>(server, Method.post, `/apps/uninstall`, { }, body)
    await this.s9Model.removeApp(server, appId)
  }

  async startApp (server: S9Server, app: AppInstalled): Promise<AppInstalled> {
    // @TODO remove
    return mockStartApp()
    // return this.httpService.authServerRequest<Lan.PostStartAppRes>(server, Method.post, `/apps/${app.id}/start`)
      .then(mapApiInstalledApp)
  }

  async stopApp (server: S9Server, app: AppInstalled): Promise<AppInstalled> {
    // @TODO remove
    return mockStopApp()
    // return this.httpService.authServerRequest<Lan.PostStopAppRes>(server, Method.post, `/apps/${app.id}/stop`)
      .then(mapApiInstalledApp)
  }

  async updateAppConfig (server: S9Server, app: AppInstalled, config: object): Promise<void> {
    // @TODO remove
    await mockUpdateAppConfig()
    // await this.httpService.authServerRequest<Lan.PostUpdateAppConfigRes>(server, Method.patch, `/apps/installed/${app.id}/config`, { }, { config })
  }
}

function mapApiInstalledApp (app: ApiAppInstalled): AppInstalled {
  return {
    ...app,
    statusAt: new Date(),
  }
}

function mapSpecToConfig (spec: AppValueSpec, config: any): any {
  switch (spec.type) {
    case 'object':
      return mapSpecToConfigObject(spec, config)
    case 'string':
      return mapSpecToConfigString(spec, config)
    case 'list':
      return mapSpecToConfigList(spec, config)
    case 'enum':
      return mapSpecToConfigEnum(spec, config)
    default:
      return config
  }
}

function mapSpecToConfigObject (spec: AppValueSpecObject, value: object): object {
  const objectSpec = spec.spec
  Object.entries(objectSpec).map(([key, val]) => {
    const configVal = value[key]
    if (configVal !== undefined) {
      value[key] = mapSpecToConfig(val, configVal)
    } else {
      value[key] = getDefaultConfigValue(val)
      val.added = true
    }
    if (val.added) {
      spec.added = true
    }
    if (val.invalid) {
      spec.invalid = true
    }
  })
  return value
}

function mapSpecToConfigString (spec: AppValueSpecString, value: string): string {
  const pattern = spec.pattern
  if (pattern && !RegExp(pattern.regex).test(value)) {
    spec.invalid = true
  }
  return value
}

function mapSpecToConfigList (spec: AppValueSpecList, value: string[] | object[]): string[] | object[] {
  const listSpec = spec.spec
  if (listSpec.type === 'object') {
    for (let i in value) {
      value[i] = mapSpecToConfigObject(listSpec, value[i] as object)
    }
    for (let i = value.length; i < Number(spec.length.split('..')); i++) {
      (value as object[]).push(getDefaultObject(listSpec.spec))
    }
  }
  if (listSpec.type === 'string') {
    for (let i in value) {
      value[i] = mapSpecToConfigString(listSpec, value[i] as string)
    }
    for (let i = value.length; i < Number(spec.length.split('..')[0]); i++) {
      (value as string[]).push(getDefaultString(listSpec))
    }
  }
  if (listSpec.type === 'enum') {
    for (let i in value) {
      value[i] = mapSpecToConfigEnum(listSpec, value[i] as string)
    }
    for (let i = value.length; i < Number(spec.length.split('..')); i++) {
      (value as string[]).push(getDefaultEnum(listSpec))
    }
  }
  return value
}

function mapSpecToConfigEnum (spec: AppValueSpecEnum, value: string) {
  if (!spec.values.includes(value)) {
    spec.invalid = true
  }
  return value
}

function getDefaultConfigValue (spec: AppValueSpec): object | string | object[] | string[] | boolean | null {
  if (spec.type !== 'list' && spec.type !== 'boolean' && spec.nullable) {
    return null
  }

  switch (spec.type) {
    case 'object':
      return getDefaultObject(spec.spec)
    case 'string':
      return getDefaultString(spec)
    case 'list':
      return getDefaultList(spec)
    case 'enum':
      return getDefaultEnum(spec)
    case 'boolean':
      return getDefaultBoolean(spec)
  }
}

function getDefaultObject (spec: AppConfigSpec): object {
  const obj = { }
  Object.entries(spec).map(([key, val]) => {
    obj[key] = getDefaultConfigValue(val)
  })
  return obj
}

function getDefaultString (spec: AppValueSpecString): string {
  if (typeof spec.default === 'string') {
    return spec.default
  } else {
    const [min, max] = spec.default!.length.split('..').map(Number)
    const length = crypto.getRandomNumberInRange(min, max || MAX_ENTROPY)
    let s = ''
    for (let i = 0; i < length; i++) {
      s = s + crypto.getRandomCharInSet(spec.default!.charset)
    }
    return s
  }
}

function getDefaultList (spec: AppValueSpecList): object[] | string[] {
  const listSpec = spec.spec
  let fn: () => string | object = () => ({ })
  switch (listSpec.type) {
    case 'object':
      fn = () => getDefaultObject(listSpec.spec)
      break
    case 'string':
      fn = () => getDefaultString(listSpec)
      break
    case 'enum':
      fn = () => getDefaultEnum(listSpec)
      break
  }

  let list: any[] = []
  for (let i = 0; i < Number(spec.length.split('..')[0]); i++) {
    list.push(fn())
  }

  return list
}

function getDefaultEnum (spec: AppValueSpecEnum): string {
  return spec.default!
}

function getDefaultBoolean (spec: AppValueSpecBoolean): boolean {
  return spec.default
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
  return [mockApiAppInstalled]
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
  return mockApiAppInstalled
}

// @TODO remove
async function mockStopApp (): Promise<Lan.PostStopAppRes> {
  return mockApiAppInstalled
}

// @TODO remove
async function mockUpdateAppConfig (): Promise<Lan.PostUpdateAppConfigRes> {
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
  status: AppHealthStatus.NEEDS_CONFIG,
  iconURL: 'assets/img/bitcoin_core.png',
}

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
      nullable: true,
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
          spec: {
            type: 'object',
            description: '',
            nullable: true,
            spec: {
              rulemakername: {
                type: 'string',
                description: 'the name of the rule maker',
                nullable: false,
              },
              rulemakerip: {
                type: 'string',
                description: 'the ip of the rule maker',
                nullable: false,
                pattern: {
                  regex: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
                  description: 'may only contain numbers and periods',
                },
              },
            },
          },
          length: '2',
        }  as AppValueSpecList,
        rpcuser: {
          type: 'string',
          description: 'rpc username',
          nullable: true,
          pattern: {
            regex: '^[a-zA-Z]+$',
            description: 'must contain only letter and be less than 50 characters in length.',
          },
        },
        rpcpass: {
          type: 'string',
          description: 'rpc password',
          nullable: true,
        },
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
      spec: {
        type: 'string',
        nullable: false,
        pattern: {
          regex: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$',
          description: 'may only contain numbers and periods',
        },
      },
      length: '0..10',
    } as AppValueSpecList,
    rpcauth: {
      type: 'list',
      description: 'api keys that are authorized to access your Bitcoin node.',
      spec: {
        type: 'string',
        nullable: false,
      },
      length: '0..',
    } as AppValueSpecList,
  },
  // actual config
  config: {
    randomEnum: 'option1',
    testnet: true,
    rpcuserpass: {
      rules: { rule1: 'you know', rule2: 'you better know' },
      rulemakers: [
        {
          rulemakername: 'joeuser',
          rulemakerip: '192.168.1.1',
        },
        {
          rulemakername: 'sallyuser',
          rulemakerip: '192.168.1.0',
        },
      ],
      rpcuser: 'matt',
      rpcpass: 'hjsbdioqwdubwedo',
    },
    port: '8333',
    maxconnections: null,
    rpcallowip: [],
    rpcauth: ['matt: 8273gr8qwoidm1uid91jeh8y23gdio1kskmwejkdnm'],
  },
}