import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppModel } from './app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  darkCache$: BehaviorSubject <{ [id: string]: BehaviorSubject<S9Server> }> = new BehaviorSubject({ })

  constructor (
    private readonly storage: Storage,
    private readonly appModel: AppModel,
  ) { }

  watchOne (id: string): BehaviorSubject<S9Server> {
    if (!this.darkCache$.value[id]) throw new Error (`No cached server for ${id}`)
    return this.darkCache$.value[id]
  }

  watchAll (): Observable<{ [id: string]: BehaviorSubject<S9Server> }> {
    return this.darkCache$
  }

  peekOne (id: string): Readonly<S9Server> {
    if (!this.darkCache$.value[id] || !this.darkCache$.value[id].value) throw new Error (`No cached server for ${id}`)
    return this.darkCache$.value[id].value
  }

  peekAll (): Readonly<S9Server>[] {
    return Object.values(this.darkCache$.value).map(s => s.value)
  }

  count (): number { return this.peekAll().length }

  // no op if missing
  removeFromCache (id: string): void {
    if (this.darkCache$.value[id]) {
      const previousCache = this.darkCache$.value
      this.darkCache$.value[id].complete()
      delete previousCache[id]
      this.darkCache$.next(previousCache)
    }
  }

  // no op if missing
  updateCache (id: string, update: Partial<S9Server>): void {
    if (this.darkCache$.value[id]) {
      const updatedServer = { ...this.peekOne(id), ...update }
      this.darkCache$.value[id].next(updatedServer)
    }
  }

  // no op if already exists
  createInCache (server: S9Server): void {
    if (!this.darkCache$.value[server.id]) {
      const previousCache = this.darkCache$.value
      previousCache[server.id] = new BehaviorSubject(server)
      this.appModel.createServerCache(server.id)
      this.darkCache$.next(previousCache)
    }
  }

  clearCache () {
    this.peekAll().forEach(s => this.removeFromCache(s.id) )
    this.darkCache$.complete()
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    fromStorage.forEach(s => {
      this.createInCache(fromStorableServer(s, mnemonic))
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
  status: ServerStatus
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
    status: ServerStatus.UNKNOWN,
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

export enum ServerStatus {
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  UPDATING = 'UPDATING',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RUNNING = 'RUNNING',
}
