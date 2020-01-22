import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppHealthStatus, AppModel } from './app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'
import { BehaviorSubject, Observable, from } from 'rxjs'

type ServerCache = { [id: string]: BehaviorSubject<S9Server> }

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  serverMap$ = new BehaviorSubject<ServerCache>({ })

  constructor (
    private readonly storage: Storage,
    private readonly appModel: AppModel,
  ) { }

  watchAllServers (): Observable<ServerCache> { return this.serverMap$ }
  watchServer (serverId: string) : Observable<S9Server> | undefined {
    return this.serverMap$.value[serverId]
  }

  peekServer (serverId: string): S9Server | undefined {
    return (this.serverMap$.value[serverId] && this.serverMap$.value[serverId].value)
  }
  peekServerMap (): ServerCache { return this.serverMap$.value }

  private pokeServerMap (serverMapReplacement: ServerCache): void {
    this.serverMap$.next(serverMapReplacement)
  }

  forceAddServer (s9: S9Server): void {
    let serverMap = this.peekServerMap()
    serverMap[s9.id] = new BehaviorSubject<S9Server>(s9)
    this.pokeServerMap(serverMap)
  }

  removeServer (s9Id: string): void {
    let serverMap = this.peekServerMap()
    serverMap[s9Id].next(undefined)
    this.pokeServerMap(serverMap)
  }

  updateServer (serverId: string, update: Partial<S9Server>): void {
    let serverMap = this.peekServerMap()
    if (serverMap[serverId]) {
      serverMap[serverId] = { ...serverMap[serverId], ...update }
    }
    this.pokeServerMap(serverMap)
  }

  upsertServer (server: S9Server, update: Partial<S9Server>): void {
    let serverMap = this.peekServerMap()
    if (serverMap[server.id]) {
      serverMap[server.id] = { ...serverMap[server.id], ...update }
    } else {
      serverMap[server.id] = server
    }
    this.pokeServerMap(serverMap)
  }

  peekServerCount (): number { return this.peekServers().length }
  peekServers (): Readonly<S9Server>[] { return Object.values(this.peekServerMap()) }

  forceClearCache () {
    this.serverMap$.next({ })
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    fromStorage.forEach(s => {
      const serverMap = { }
      serverMap[s.id] = fromStorableServer(s, mnemonic)
      this.pokeServerMap(serverMap)
      this.appModel.appMap[s.id] = { }
    })
  }

  async saveAll (): Promise<void> {
    await this.storage.set('servers', this.peekServers().map(toStorableServer))
  }
}

type S9ServerStore = S9ServerStorable[]

export interface S9ServerStorable {
  id: string
  label: string
  torAddress: string
  versionInstalled: string
}

export interface S9Server extends S9ServerStorable {
  updating: boolean
  status: AppHealthStatus
  statusAt: string
  versionLatest: string
  privkey: string // derive from mnemonic + torAddress
  badge: number
  notifications: S9Notification[]
}

export interface S9Notification {
  id: string
  appId: string
  createdAt: string
  code: string
  title: string
  message: string
}

export type ServerSpecs = { [key: string]: string | number }

export type ServerMetrics = {
  [key: string]: {
    [key: string]: {
      value: number
      unit: string
    }
  }
}

export interface SSHFingerprint {
  alg: string
  hash: string
  hostname: string
}

export function getLanIP (zcs: ZeroconfService): string {
  const { ipv4Addresses, ipv6Addresses } = zcs

  let url: string
  if (ipv4Addresses.length) {
    url = ipv4Addresses[0]
  } else {
    url = `[${ipv6Addresses[0]}]`
  }
  return url + ':5959'
}

export function fromStorableServer (ss : S9ServerStorable, mnemonic: string[]): S9Server {
  const { label, torAddress, id, versionInstalled } = ss
  return {
    id,
    label,
    torAddress,
    versionInstalled,
    versionLatest: '0.0.0',
    updating: false,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date().toISOString(),
    privkey: deriveKeys(mnemonic, id).privkey,
    badge: 0,
    notifications: [],
  }
}

export function toStorableServer (ss: S9Server): S9ServerStorable {
  const { label, torAddress, id, versionInstalled } = ss

  return {
    id,
    label,
    torAddress,
    versionInstalled,
  }
}

export function idFromSerial (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}
