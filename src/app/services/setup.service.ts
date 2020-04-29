import { Injectable } from '@angular/core'
import { S9Server, getLanIP, ServerStatus } from '../models/server-model'
import { Method } from 'src/app/types/enums'
import { pauseFor } from 'src/app/util/misc.util'
import { AuthService } from './auth.service'
import { Lan } from '../types/api-types'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { HttpLanService } from './http-lan.service'
import { HttpTorService } from './http-tor.service'
import { HttpService } from './http.service'
import * as cryptoUtil from '../util/crypto.util'

@Injectable({
  providedIn: 'root',
})
export class SetupService {
  private static readonly setupAttempts = 8
  private static readonly waitForMS = 1000 // miliseconds
  public message = ''

  constructor (
    private readonly http: HttpLanService,
    private readonly httpRaw: HttpService,
    private readonly httpTor: HttpTorService,
    private readonly authService: AuthService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async setup (builder: S9ServerBuilder, productKey: string): Promise<S9Server> {
    // **** Mock ****
    return toS9Server(this.mockServer(builder))

    // for (let i = 0; i < SetupService.setupAttempts; i ++) {
    //   builder = await this.discoverAttempt(builder)
    //   await pauseFor(SetupService.waitForMS)
    // }

    // if (!isDiscovered(builder)) {
    //   throw new Error(`Failed ${this.message}`)
    // }

    // builder = await this.setupAttempt(builder, productKey)

    // if (!isFullySetup(builder)) {
    //   throw new Error(`Failed ${this.message}`)
    // }

    // return toS9Server(builder)
  }

  private async discoverAttempt (builder: S9ServerBuilder): Promise<S9ServerBuilder> {
    // enable lan
    if (!hasValues(['zeroconf'], builder)) {
      this.message = `discovering server on local network. Please check your Product Key and see "Instructions" below.`
      builder.zeroconf = this.zeroconfDaemon.getService(builder.id)
    }

    // agent version
    if (hasValues(['zeroconf'], builder) && !hasValues(['versionInstalled'], builder)) {
      this.message = `communicating with server`
      builder.versionInstalled = await this.getVersion(builder)
    }

    return builder
  }

  private async setupAttempt (builder: S9BuilderWith<'zeroconf' | 'versionInstalled'>, productKey: string): Promise<S9ServerBuilder> {
    // derive keys
    if (!hasValues(['pubkey', 'privkey'], builder)) {
      this.message = 'getting mnemonic'
      if (this.authService.mnemonic) {
        this.message = `deriving keys`
        const { privkey, pubkey } = cryptoUtil.deriveKeys(this.authService.mnemonic, builder.id)
        builder.privkey = privkey
        builder.pubkey = pubkey
      }
    }

    // register pubkey
    if (hasValues(['pubkey', 'privkey'], builder) && !builder.registered) {
      this.message = `registering pubkey. Server may already be claimed.`
      builder.registered = await this.registerPubkey(builder, productKey) // true or false
    }

    // tor acquisition
    if (hasValues(['pubkey', 'privkey'], builder) && builder.registered && !hasValues(['torAddress'], builder)) {
      this.message = `getting server tor address`
      builder.torAddress = await this.getTor(builder)
    }

    // get server
    if (
      hasValues(['pubkey', 'privkey', 'torAddress'], builder) &&
      builder.registered &&
      builder.status !== ServerStatus.RUNNING
    ) {
      this.message = `getting server information`
      await this.getServer(builder)
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
      const { version } = await this.httpRaw.request<Lan.GetVersionRes>({ method: Method.get, url: `http://${host}:5959/version` })
      return version
    } catch (e) {
      return undefined
    }
  }

  async registerPubkey (builder: S9BuilderWith<'zeroconf' | 'versionInstalled' | 'pubkey' | 'privkey'>, productKey: string): Promise<boolean> {
    const { pubkey } = builder
    try {
      const data: Lan.PostRegisterReq = { pubKey: pubkey, productKey }
      await this.http.request<Lan.PostRegisterRes>(builder, { method: Method.post, url: '/register', data })
      return true
    } catch (e) {
      return false
    }
  }

  async getTor (builder: S9BuilderWith<'zeroconf' | 'versionInstalled' | 'pubkey' | 'privkey'>): Promise<string | undefined> {
    try {
      const { torAddress } = await this.http.request<Lan.GetTorRes>(builder, { method: Method.get, url: '/tor' })
      return torAddress
    } catch (e) {
      return undefined
    }
  }

  async getServer (builder: S9BuilderWith<'zeroconf' | 'versionInstalled' | 'pubkey' | 'privkey' | 'torAddress'>): Promise<Lan.GetServerRes> {
    return this.httpTor.request<Lan.GetServerRes>(builder, { method: Method.get, url: '' })
  }

  // @TODO remove
  mockServer (builder: S9ServerBuilder): Required<S9ServerBuilder> {
    return {
      id: builder.id,
      label: builder.label,
      torAddress: 'agent-tor-address-isaverylongaddresssothaticantestwrapping.onion',
      versionInstalled: '0.1.0',
      status: ServerStatus.RUNNING,
      statusAt: new Date().toISOString(),
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

  status: ServerStatus
  statusAt: string
  versionInstalled?: string

  privkey?: string
  pubkey?: string
  registered: boolean

  torAddress?: string
  zeroconf?: ZeroconfService
}

export function hasValues<T extends keyof S9ServerBuilder> (t: T[], s: S9ServerBuilder): s is S9BuilderWith<T> {
  return t.every(k => !!s[k])
}

export function isDiscovered (ss: S9ServerBuilder): ss is S9BuilderWith<'zeroconf' | 'versionInstalled'> {
  return hasValues(['zeroconf', 'versionInstalled'], ss)
}

export function isFullySetup (ss: S9ServerBuilder): ss is Required<S9ServerBuilder> {
  return hasValues(builderKeys(), ss) && ss.registered && ss.status === ServerStatus.RUNNING
}

export function fromUserInput (id: string, label: string): S9ServerBuilder {
  return {
    id,
    label,
    status: ServerStatus.UNKNOWN,
    statusAt: new Date().toISOString(),
    registered: false,
  }
}

export function toS9Server (builder: Required<S9ServerBuilder>): S9Server {
  return {
    ...builder,
    badge: 0,
    notifications: [],
    versionLatest: undefined, // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
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
  privkey:          undefined as any,
  pubkey:           undefined as any,
  registered:       undefined as any,
  torAddress:       undefined as any,
  zeroconf:         undefined as any,
}