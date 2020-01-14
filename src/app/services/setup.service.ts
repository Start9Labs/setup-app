import { Injectable } from '@angular/core'
import { S9Server, ServerSpecs, getLanIP, ServerModel } from '../models/server-model'
import { HttpService } from './http.service'
import { Method } from 'src/app/types/enums'
import { pauseFor } from 'src/app/util/misc.util'
import * as cryptoUtil from '../util/crypto.util'
import { AuthService } from './auth.service'
import { Lan } from '../types/api-types'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { AppHealthStatus } from '../models/app-model'
import { ServerService } from './server.service'

@Injectable({
  providedIn: 'root',
})
export class SetupService {
  private static readonly setupAttempts = 10
  private static readonly timeout = 3000
  private static readonly waitForMS = 1000
  public message = ''

  constructor (
    private readonly httpService: HttpService,
    private readonly serverModel: ServerModel,
    private readonly authService: AuthService,
    private readonly serverService: ServerService,
  ) { }

  async setup (builder: S9ServerBuilder, productKey: string): Promise<S9Server> {
    for (let i = 0; i < SetupService.setupAttempts; i ++) {
      // @TODO delete
      // builder = this.mockServer(builder)
      builder = await this.setupAttempt(builder, productKey)
      if (isFullySetup(builder)) {
        return toS9Server(builder)
      }
      await pauseFor(SetupService.waitForMS)
    }

    throw new Error(`failed ${this.message}`)
  }

  private async setupAttempt (builder: S9ServerBuilder, productKey: string): Promise<S9ServerBuilder> {

    // enable lan
    if (!hasValues(['zeroconf'], builder)) {
      this.message = `getting zeroconf service`
      builder.zeroconf = this.serverModel.getZeroconf(builder.id)
    }

    // agent version
    if (hasValues(['zeroconf'], builder) && !hasValues(['versionInstalled'], builder)) {
      this.message = `getting agent version`
      builder.versionInstalled = await this.getVersion(builder)
    }

    // tor acquisition
    if (hasValues(['zeroconf', 'versionInstalled'], builder) && !hasValues(['torAddress'], builder)) {
      this.message = `getting tor address`
      builder.torAddress = await this.getTor(builder)
    }

    // derive keys
    if (hasValues(['zeroconf', 'versionInstalled', 'torAddress'], builder) && !hasValues(['pubkey', 'privkey'], builder)) {
      this.message = 'getting mnemonic'
      if (this.authService.mnemonic) {
        this.message = `deriving keys`
        const { privkey, pubkey } = cryptoUtil.deriveKeys(this.authService.mnemonic, builder.id)
        builder.privkey = privkey
        builder.pubkey = pubkey
      }
    }

    // register pubkey
    if (hasValues(['zeroconf', 'versionInstalled', 'torAddress', 'pubkey', 'privkey'], builder) && !builder.registered) {
      this.message = `registering pubkey`
      builder.registered = await this.registerPubkey(builder, productKey) // true or false
    }

    // get server
    if (
      hasValues(['zeroconf', 'versionInstalled', 'torAddress', 'pubkey', 'privkey'], builder) &&
      builder.registered &&
      builder.status !== AppHealthStatus.RUNNING
    ) {
      this.message = `getting server`
      await this.serverService.getServer(builder)
        .then(serverRes => {
          builder = { ...builder, ...serverRes }
        })
        .catch(console.error)
    }

    return builder
  }

  async getVersion (builder: S9BuilderWith<'zeroconf'>): Promise<string | undefined> {
    try {
      const host = getLanIP(builder.zeroconf)
      const { version } = await this.httpService.request<Lan.GetVersionRes>(Method.get, `http://${host}/version`, { }, { }, SetupService.timeout)
      return version
    } catch (e) {
      return undefined
    }
  }

  async getTor (builder: S9BuilderWith<'zeroconf' | 'versionInstalled'>): Promise<string | undefined> {
    try {
      const { torAddress } = await this.httpService.serverRequest<Lan.GetTorRes>(builder, Method.get, '/tor', { }, { }, SetupService.timeout)
      return torAddress
    } catch (e) {
      return undefined
    }
  }

  async registerPubkey (builder: S9BuilderWith<'zeroconf' | 'versionInstalled' | 'pubkey'>, productKey: string): Promise<boolean> {
    const { pubkey } = builder
    try {
      const body: Lan.PostRegisterReq = { pubKey: pubkey, productKey }
      await this.httpService.serverRequest<Lan.PostRegisterRes>(builder, Method.post, '/register', { }, body, SetupService.timeout)
      return true
    } catch (e) {
      return false
    }
  }

  // @TODO remove
  mockServer (builder: S9ServerBuilder): Required<S9ServerBuilder> {
    return {
      id: builder.id,
      label: builder.label,
      torAddress: 'agent-tor-address-isaverylongaddresssothaticantestwrapping.onion',
      versionInstalled: '0.1.0',
      versionLatest: '0.1.0',
      status: AppHealthStatus.RUNNING,
      statusAt: new Date(),
      specs: builder.specs,
      privkey: 'testprivkey',
      pubkey: 'testpubkey',
      registered: true,
      zeroconf: {
        domain: 'local.',
        type: '_http._tcp',
        name: `start9-${builder.id}`,
        hostname: '',
        ipv4Addresses: ['192.168.20.1'],
        ipv6Addresses: ['end9823u0ej2fb'],
        port: 5959,
        txtRecord: { },
      },
    }
  }

}

export type S9BuilderWith<T extends keyof S9ServerBuilder> = S9ServerBuilder & {
  [t in T]: Exclude<S9ServerBuilder[t], undefined>
}

export interface S9ServerBuilder {
  id: string
  label: string

  status: AppHealthStatus
  statusAt: Date
  versionInstalled?: string
  versionLatest?: string
  specs: ServerSpecs

  privkey?: string
  pubkey?: string
  registered: boolean

  torAddress?: string
  zeroconf?: ZeroconfService
}

export function hasValues<T extends keyof S9ServerBuilder> (t: T[], s: S9ServerBuilder): s is S9BuilderWith<T> {
  return t.every(k => !!s[k])
}

export function isFullySetup (ss: S9ServerBuilder): ss is Required<S9ServerBuilder> {
  return hasValues(builderKeys(), ss) && ss.registered && ss.status === AppHealthStatus.RUNNING
}

export function fromUserInput (id: string, label: string): S9ServerBuilder {
  return {
    id,
    label,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date(),
    specs: { },
    registered: false,
  }
}

export function toS9Server (builder: Required<S9ServerBuilder>): S9Server {
  return {
    ...builder,
    updating: false,
    viewing: false,
    sshKeys: [],
    events: [],
  }
}


/////////////////// DONT LOOK AT THIS //////////////////////

function builderKeys (): (keyof S9ServerBuilder)[] {
  return Object.keys(defaultBuilder) as (keyof S9ServerBuilder)[]
}

const defaultBuilder: Required<S9ServerBuilder> = {
  id:               undefined as any,
  label:            undefined as any,
  status:           undefined as any,
  statusAt:         undefined as any,
  versionInstalled: undefined as any,
  versionLatest:    undefined as any,
  specs:            undefined as any,
  privkey:          undefined as any,
  pubkey:           undefined as any,
  registered:       undefined as any,
  torAddress:       undefined as any,
  zeroconf:         undefined as any,
}