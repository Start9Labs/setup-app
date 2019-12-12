import { Injectable } from '@angular/core'
import { S9Server, toS9AgentApp, ServerSpecs, getLanIP } from '../models/s9-server'
import { HttpService } from './http.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { Method } from 'src/app/types/enums'
import { clone } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import * as crypto from '../util/crypto.util'
import { AuthService } from './auth.service'
import { Lan } from '../types/api-types'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { AppHealthStatus } from '../models/s9-app'
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
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly authService: AuthService,
    private readonly serverService: ServerService,
  ) { }

  async setup (ss: S9ServerBuilder, productKey: string): Promise<S9Server> {
    let serverBuilder = ss
    for (let i = 0; i < SetupService.setupAttempts; i ++) {
      // @TODO delete
      serverBuilder = this.mockServer(serverBuilder)
      // serverBuilder = await this.setupAttempt(serverBuilder, productKey)
      if (isFullySetup(serverBuilder)) {
        return toS9Server(serverBuilder)
      }
      await pauseFor(SetupService.waitForMS)
    }

    throw new Error(`failed ${this.message}`)
  }

  private async setupAttempt (ss: S9ServerBuilder, productKey: string): Promise<S9ServerBuilder> {
    const ssClone = clone(ss)

    // enable lan
    if (!hasValues(['zeroconfService'], ssClone)) {
      this.message = `getting zeroconf service`
      ssClone.zeroconfService = this.zeroconfDaemon.getService(ssClone.id)
    }

    // tor acquisition
    if (hasValues(['zeroconfService'], ssClone) && !hasValues(['versionInstalled'], ssClone)) {
      this.message = `getting server version installed`
      ssClone.versionInstalled = await this.getVersion(ssClone)
    }

    // tor acquisition
    if (hasValues(['zeroconfService', 'versionInstalled'], ssClone) && !hasValues(['torAddress'], ssClone)) {
      this.message = `getting tor address`
      ssClone.torAddress = await this.getTor(ssClone)
    }

    // derive keys
    if (hasValues(['zeroconfService', 'versionInstalled', 'torAddress'], ssClone) && !hasValues(['pubkey', 'privkey'], ssClone)) {
      this.message = 'getting mnemonic'
      if (this.authService.mnemonic) {
        this.message = `deriving keys`
        const { privkey, pubkey } = crypto.deriveKeys(this.authService.mnemonic, ssClone.id)
        ssClone.privkey = privkey
        ssClone.pubkey = pubkey
      }
    }

    // register pubkey
    if (hasValues(['zeroconfService', 'versionInstalled', 'torAddress', 'pubkey', 'privkey'], ssClone) && !ssClone.registered) {
      this.message = `registering pubkey`
      ssClone.registered = await this.registerPubkey(ssClone, productKey) // true or false
    }

    // get server
    if (
      hasValues(['zeroconfService', 'versionInstalled', 'torAddress', 'pubkey', 'privkey'], ssClone) &&
      ss.registered &&
      ss.status !== AppHealthStatus.RUNNING
    ) {
      this.message = `getting server`
      await this.serverService.getServer(ssClone)
        .then(res => {
          const { versionLatest, status, statusAt, specs } = res
          ssClone.versionLatest = versionLatest
          ssClone.status = status
          ssClone.statusAt = statusAt
          ssClone.specs = specs
        })
        .catch(console.error)
    }

    return ssClone
  }

  async getVersion (ss: S9BuilderWith<'zeroconfService'>): Promise<string | undefined> {
    try {
      const host = getLanIP(ss.zeroconfService)
      const { version } = await this.httpService.request<Lan.GetVersionRes>(Method.get, `https://${host}/version`, { }, { }, SetupService.timeout)
      return version
    } catch (e) {
      return undefined
    }
  }

  async getTor (ss: S9BuilderWith<'zeroconfService' | 'versionInstalled'>): Promise<string | undefined> {
    try {
      const { torAddress } = await this.httpService.serverRequest<Lan.GetTorRes>(ss, Method.get, '/tor', { }, { }, SetupService.timeout)
      return torAddress
    } catch (e) {
      return undefined
    }
  }

  async registerPubkey (ss: S9BuilderWith<'zeroconfService' | 'versionInstalled' | 'pubkey'>, productKey: string): Promise<boolean> {
    const { pubkey } = ss
    try {
      const body: Lan.PostRegisterReq = { pubKey: pubkey, productKey }
      await this.httpService.serverRequest<Lan.PostRegisterRes>(ss, Method.post, '/register', { }, body, SetupService.timeout)
      return true
    } catch (e) {
      return false
    }
  }

  // @TODO remove
  mockServer (ss: S9ServerBuilder): Required<S9ServerBuilder> {
    return {
      id: ss.id,
      friendlyName: ss.friendlyName,
      torAddress: 'agent-tor-address.onion',
      versionInstalled: '0.1.0',
      versionLatest: '0.1.0',
      status: AppHealthStatus.RUNNING,
      statusAt: new Date(),
      specs: ss.specs,
      privkey: 'testprivkey',
      pubkey: 'testpubkey',
      registered: true,
      zeroconfService: {
        domain: 'local.',
        type: '_http._tcp',
        name: `start9-${ss.id}`,
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
  friendlyName: string

  status: AppHealthStatus
  statusAt: Date
  versionInstalled?: string
  versionLatest?: string
  specs: ServerSpecs

  privkey?: string
  pubkey?: string
  registered: boolean

  torAddress?: string
  zeroconfService?: ZeroconfService
}

export function hasValues<T extends keyof S9ServerBuilder> (t: T[], s: S9ServerBuilder): s is S9BuilderWith<T> {
  return t.every(k => !!s[k])
}

export function isFullySetup (ss: S9ServerBuilder): ss is Required<S9ServerBuilder> {
  return hasValues(builderKeys(), ss) && ss.registered && (ss.status === AppHealthStatus.RUNNING)
}

export function fromUserInput (id: string, friendlyName: string): S9ServerBuilder {
  return {
    id,
    friendlyName,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date(),
    specs: { },
    registered: false,
  }
}

export function toS9Server (sb: Required<S9ServerBuilder>): S9Server {
  const { id, friendlyName, status, statusAt, versionInstalled, versionLatest, privkey, torAddress, zeroconfService, specs } = sb
  const server: S9Server = {
    id,
    friendlyName,
    status,
    statusAt,
    versionInstalled,
    versionLatest,
    specs,
    privkey,
    torAddress,
    zeroconfService,
    apps: [],
    updating: false,
  }

  server.apps.push(toS9AgentApp(server))

  return server
}


/////////////////// DONT LOOK AT THIS //////////////////////

function builderKeys (): (keyof S9ServerBuilder)[] {
  return Object.keys(defaultBuilder) as (keyof S9ServerBuilder)[]
}

const defaultBuilder: Required<S9ServerBuilder> = {
  id:               undefined as any,
  friendlyName:     undefined as any,
  status:           undefined as any,
  statusAt:         undefined as any,
  versionInstalled: undefined as any,
  versionLatest:    undefined as any,
  specs:            undefined as any,
  privkey:          undefined as any,
  pubkey:           undefined as any,
  registered:       undefined as any,
  torAddress:       undefined as any,
  zeroconfService:  undefined as any,
}