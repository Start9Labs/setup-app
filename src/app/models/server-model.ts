import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppHealthStatus, AppModel } from './app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  serverMap: { [id: string]: S9Server } = { }

  get servers () { return Object.values(this.serverMap) as Readonly<S9Server>[] }
  get count () { return this.servers.length }

  constructor (
    private readonly storage: Storage,
    private readonly appModel: AppModel,
  ) { }

  clearCache () {
    this.serverMap = { }
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    fromStorage.forEach(s => {
      this.serverMap[s.id] = fromStorableServer(s, mnemonic)
      this.appModel.appMap[s.id] = { }
    })
  }

  getServer (id: string): Readonly<S9Server> | undefined {
    return this.serverMap[id]
  }

  async createServer (server: S9Server): Promise<void> {
    this.serverMap[server.id] = server
    this.appModel.appMap[server.id] = { }
    await this.saveAll()
  }

  async forgetServer (id: string): Promise<void> {
    delete this.serverMap[id]
    delete this.appModel.appMap[id]
    await this.saveAll()
  }

  // uses the full server object as a default value in case that server was never present
  cacheServer (server: Readonly<S9Server>, updates: Partial<S9Server>): Readonly<S9Server> {
    this.serverMap[server.id] = Object.assign(this.getServer(server.id) || server, updates)
    return this.getServer(server.id) as Readonly<S9Server>
  }

  async saveAll (): Promise<void> {
    await this.storage.set('servers', Object.values(this.serverMap).map(toStorableServer))
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
  statusAt: Date
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
    statusAt: new Date(),
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
