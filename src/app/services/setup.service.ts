import { Injectable } from '@angular/core'
import { unknownAppStatusAttempt, S9Server, toS9AgentApp } from '../models/s9-server'
import { HttpService } from './http.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { Method } from 'src/app/types/enums'
import { clone } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import * as crypto from '../util/crypto.util'
import { AuthService } from './auth.service'
import { Lan } from '../types/api-types'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { AppHealthStatus, AppStatusAttempt } from '../models/s9-app'
import { StatusCheckService } from './status-check.service'

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
    private readonly statusCheckService: StatusCheckService,
  ) { }

  async setup (ss: S9ServerBuilder, productKey: string): Promise<Required<S9ServerBuilder>> {
    let serverBuilder = ss
    for (let i = 0; i < SetupService.setupAttempts; i ++) {
      serverBuilder = await this.setupAttempt(serverBuilder, productKey)
      if (isFullySetup(serverBuilder)) {
        return serverBuilder
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
    if (hasValues(['zeroconfService'], ssClone) && !hasValues(['torAddress'], ssClone)) {
      this.message = `getting tor address`
      ssClone.torAddress = await this.getTor(ssClone)
    }

    // derive keys
    if (hasValues(['zeroconfService', 'torAddress'], ssClone) && !hasValues(['pubkey', 'privkey'], ssClone)) {
      this.message = `deriving keys`
      if (this.authService.mnemonic) {
        const { privkey, pubkey } = crypto.deriveKeys(this.authService.mnemonic, ssClone.torAddress)
        ssClone.privkey = privkey
        ssClone.pubkey = pubkey
      } else {
        this.message = 'extracting auth service mnemonic'
      }
    }

    // pubkey registration
    if (hasValues(['zeroconfService', 'torAddress', 'pubkey', 'privkey'], ssClone) && !ssClone.registered) {
      this.message = `registering pubkey`
      ssClone.registered = await this.registerPubkey(ssClone, productKey) // true or false
    }

    // lan status check
    if (
      hasValues(['zeroconfService', 'torAddress', 'pubkey', 'privkey'], ssClone) &&
      ss.registered &&
      (ss.lastStatusAttempt.status !== AppHealthStatus.RUNNING || !hasValues(['version'], ssClone))
    ) {
      this.message = `executing server status check`
      const { attempt, version } = await this.statusCheckService.getS9AgentStatus(ssClone)
      ssClone.version = version
      ssClone.lastStatusAttempt = attempt
    }

    return ssClone
  }

  async getTor (ss: S9BuilderWith<'zeroconfService'>): Promise<string | undefined> {
    try {
      const { torAddress } = await this.httpService.serverRequest<Lan.GetTorRes>(ss, Method.get, '/tor', { }, { }, SetupService.timeout)
      return torAddress
    } catch (e) {
      console.error(`failed getting Tor address.`)
      return undefined
    }
  }

  async registerPubkey (ss: S9BuilderWith<'zeroconfService' | 'pubkey'>, productKey: string): Promise<boolean> {
    const { id, pubkey } = ss
    try {
      const body: Lan.PostRegisterReq = { pubkey, serial: productKey }
      await this.httpService.serverRequest<Lan.PostRegisterRes>(ss, Method.post, '/register', { }, body, SetupService.timeout)
      return true
    } catch (e) {
      console.error(`failed pubkey registration for ${id}: ${e.message}`)
      return false
    }
  }

  // @TODO remove
  mockServer (ss: S9ServerBuilder): Required<S9ServerBuilder> {
    return {
      id: ss.id,
      friendlyName: ss.friendlyName,
      torAddress: 'agent-tor-address.onion',
      lastStatusAttempt: {
        status: AppHealthStatus.RUNNING,
        timestamp: new Date(),
      },
      version: '1.0.0',
      privkey: '',
      pubkey: '',
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

  lastStatusAttempt: AppStatusAttempt
  version?: string

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
  return hasValues(builderKeys(), ss) && ss.registered && (ss.lastStatusAttempt.status == AppHealthStatus.RUNNING)
}

export function fromUserInput (id: string, friendlyName: string): S9ServerBuilder {
  return {
    id,
    friendlyName,
    lastStatusAttempt: unknownAppStatusAttempt(),
    registered: false,
  }
}

export function toS9Server (sb: Required<S9ServerBuilder>): S9Server {
  const { id, friendlyName, lastStatusAttempt, version, privkey, torAddress, zeroconfService } = sb
  const toReturn: S9Server = {
    id,
    friendlyName,
    lastStatusAttempt,
    version,
    apps: [],
    specs: [],
    privkey,
    torAddress,
    zeroconfService,
  }

  toReturn.apps.push(toS9AgentApp(toReturn))

  return toReturn
}


/////////////////// DONT LOOK AT THIS //////////////////////

function builderKeys (): (keyof S9ServerBuilder)[] {
  return Object.keys(defaultBuilder) as (keyof S9ServerBuilder)[]
}

const defaultBuilder: Required<S9ServerBuilder> = {
  id:              undefined as any,
  friendlyName:    undefined as any,
  lastStatusAttempt:   undefined as any,
  version:         undefined as any,
  privkey:         undefined as any,
  pubkey:          undefined as any,
  registered:      undefined as any,
  torAddress:      undefined as any,
  zeroconfService: undefined as any,
}