import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppHealthStatus, AppModel } from './app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'
import { BehaviorSubject, Observable, from, Subject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  cache: { [id: string]: BehaviorSubject<S9Server> } = {  }
  serverDelta$ : Subject<boolean> = new Subject()

  constructor (
    private readonly storage: Storage,
    private readonly appModel: AppModel,
  ) { }

  watch (serverId: string) : Observable<S9Server> {
    if (!this.cache[serverId]) throw new Error (`Excpected cached server for ${serverId} but none found`)
    return this.cache[serverId]
  }

  peek (serverId: string): S9Server {
    if (!this.cache[serverId] || !this.cache[serverId].value) throw new Error (`Excpected cached server for ${serverId} but none found`)
    return this.cache[serverId].value
  }

  // no op if missing
  remove (serverId: string): void {
    if (this.cache[serverId]) {
      this.cache[serverId].complete()
      delete this.cache[serverId]
      this.serverDelta$.next(true)
    }
  }

  // no op if missing
  update (serverId: string, update: Partial<S9Server>): void {
    if (this.cache[serverId]) {
      const updatedServer = { ...this.cache[serverId].value, ...update }
      this.cache[serverId].next(updatedServer)
      this.serverDelta$.next(true)
    }
  }

  // no op if already exists
  create (server: S9Server): void {
    if (!this.cache[server.id]) {
      this.cache[server.id] = new BehaviorSubject(server)
      this.serverDelta$.next(true)
    }
  }

  count (): number { return this.peekAll().length }
  peekAll (): Readonly<S9Server>[] { return Object.values(this.cache).map(s => s.value) }

  clearCache () {
    this.peekAll().forEach( s => this.remove(s.id) )
    this.cache = { }
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    fromStorage.forEach(s => {
      this.create(fromStorableServer(s, mnemonic))
      this.appModel.appMap[s.id] = { }
    })
  }

  async saveAll (): Promise<void> {
    await this.storage.set('servers', this.peekAll().map(toStorableServer))
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
