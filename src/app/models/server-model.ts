import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppHealthStatus, AppModel } from './app-model'
import { AuthService } from '../services/auth.service'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'
import { AuthStatus } from '../types/enums'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  servers: S9Server[] = []

  constructor (
    private readonly storage: Storage,
    private readonly authService: AuthService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly appModel: AppModel,
  ) { }

  init () {
    this.authService.authState.subscribe(async authStatus => {
      if (authStatus === AuthStatus.VERIFIED) {
        await this.load(this.authService.mnemonic!)
      } else {
        this.servers = []
      }
    })
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    fromStorage.forEach(s => {
      this.servers.push(fromStorableServer(s, mnemonic))
      this.appModel.apps[s.id] = []
    })
  }

  getServer (id: string): S9Server | undefined {
    return this.servers.find(s => s.id === id)
  }

  async createServer (server: S9Server): Promise<void> {
    this.servers.push(server)
    this.appModel.apps[server.id] = []
    await this.saveAll()
  }

  async forgetServer (id: string): Promise<void> {
    const index = this.servers.findIndex(s => s.id === id)
    if (index > -1) {
      this.servers.splice(index, 1)
      await this.saveAll()
    }
    delete this.appModel.apps[id]
  }

  async saveAll (): Promise<void> {
    await this.storage.set('servers', this.servers.map(toStorableServer))
  }

  getZeroconf (serverId: string): ZeroconfService | undefined {
    return this.zeroconfDaemon.services[`start9-${serverId}`]
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
  viewing: boolean
  status: AppHealthStatus
  statusAt: Date
  specs: ServerSpecs
  versionLatest: string
  privkey: string // derive from mnemonic + torAddress
  badge: number
  notifications: S9Notification[]
  zeroconf?: ZeroconfService
}

export interface S9Notification {
  id: string
  appId: string
  created_at: string
  code: string
  title: string
  message: string
}

export type ServerSpecs = { [key: string]: string | number }

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
    viewing: false,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date(),
    privkey: deriveKeys(mnemonic, id).privkey,
    badge: 0,
    specs: { },
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
