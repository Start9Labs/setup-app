import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { ServerAppModel } from './server-app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import { Observable, Subscription } from 'rxjs'
import { MapSubject } from '../util/map-subject.util'
import { PropertySubject, PropertyObservableWithId } from '../util/property-subject.util'
import * as CryptoJS from 'crypto-js'
import { NetworkMonitor } from '../services/network.service'
import { NetworkStatus } from '@capacitor/core'
import { AuthService } from '../services/auth.service'
import { AuthStatus } from '../types/enums'
import { TorService, TorConnection } from '../services/tor.service'

@Injectable({
  providedIn: 'root',
})
export class ServerModel extends MapSubject<S9Server> {
  private authSub: Subscription
  private networkSub: Subscription
  private torSub: Subscription

  constructor (
    private readonly serverAppModel: ServerAppModel,
    private readonly storage: Storage,
    private readonly networkMonitor: NetworkMonitor,
    private readonly authService: AuthService,
    private readonly torService: TorService,
  ) {
    super({ })
  }

  initMonitors () {
    this.authSub = this.authSub || this.authService.watch().subscribe(s => this.handleAuthChange(s))
    this.torSub = this.torSub || this.torService.watchConnection().subscribe(c => this.handleTorChange(c))
  }

  watchNetwork (): void {
    this.networkSub = this.networkSub || this.networkMonitor.watchConnection().subscribe(c => this.handleNetworkChange(c))
  }

  watchServerAdds (): Observable<PropertyObservableWithId<S9Server>[]> {
    return this.watchAdd()
  }

  watchServerDeletes (): Observable<string[]> {
    return this.watchDelete()
  }

  watchServerProperties (serverId: string) : PropertySubject<S9Server> {
    const toReturn = this.watch(serverId)
    if (!toReturn) throw new Error(`Expected Embassy ${JSON.stringify(serverId)} but not found.`)
    return toReturn
  }

  removeServer (serverId: string): void {
    this.delete([serverId])
  }

  updateServer (id: string, update: Partial<S9Server>): void {
    this.update$.next([{ ...update, id }])
  }

  createServer (server: S9Server): void {
    this.createServerAppCache(server.id)
    this.add([server])
    this.watchNetwork()
  }

  createServerAppCache (sid: string): void {
    this.serverAppModel.create(sid)
  }

  markServerUnreachable (sid: string): void {
    this.updateServer(sid, { status: ServerStatus.UNREACHABLE, connectionType: EmbassyConnection.NONE })
    this.serverAppModel.get(sid).markAppsUnreachable()
  }

  markServerUnknown (sid: string): void {
    this.updateServer(sid, { status: ServerStatus.UNKNOWN, connectionType: EmbassyConnection.NONE })
    this.serverAppModel.get(sid).markAppsUnknown()
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStorable[] = await this.storage.get('servers') || []
    const mapped = fromStorage.map(s => fromStorableServer(s, mnemonic))
    this.add(mapped)
    this.watchNetwork()
  }

  async saveAll (): Promise<void> {
    await this.storage.set('servers', this.peekAll().map(toStorableServer))
  }

  private handleNetworkChange (network: NetworkStatus): void {
    if (network.connected) {
      Object.keys(this.subject).forEach(id => this.markServerUnknown(id))
    } else {
      Object.keys(this.subject).forEach(id => this.markServerUnreachable(id))
    }
  }

  private handleAuthChange (status: AuthStatus): void {
    if (status === AuthStatus.MISSING) {
      this.clear()
    }
  }

  private handleTorChange (connection: TorConnection): void {
    if (connection === TorConnection.connected) {
      Object.entries(this.subject).forEach(([id, server]) => {
        if (server.status.getValue() === ServerStatus.UNREACHABLE) {
          this.markServerUnknown(id)
        }
      })
    }
  }
}

export interface S9ServerStorable {
  id: string
  label: string
  torAddress: string
  versionInstalled: string
}

export interface S9Server extends S9ServerStorable {
  status: ServerStatus
  privkey: string // derive from mnemonic + torAddress
  badge: number
  notifications: S9Notification[]
  versionLatest: string | undefined // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
  connectionType: EmbassyConnection
}

export interface S9Notification {
  id: string
  appId: string
  createdAt: string
  code: string
  title: string
  message: string
}

export interface ServerSpecs {
  [key: string]: string | number
}

export interface ServerMetrics {
  [key: string]: {
    [key: string]: {
      value: string | number | null
      unit?: string
    }
  }
}

export type AppMetrics = {
  [key: string]: string
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
  return url
}

export function fromStorableServer (ss : S9ServerStorable, mnemonic: string[]): S9Server {
  const { label, torAddress, id, versionInstalled } = ss
  return {
    id,
    label,
    torAddress,
    versionInstalled,
    status: ServerStatus.UNKNOWN,
    privkey: deriveKeys(mnemonic, id).privkey,
    badge: 0,
    notifications: [],
    versionLatest: undefined, // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
    connectionType: EmbassyConnection.NONE,
  }
}

export function toStorableServer (ss: S9Server): S9ServerStorable {
  const { label, torAddress, id, versionInstalled } = ss
  return {
    id,
    label,
    torAddress: torAddress.trim(), // @COMPAT Ambassador <= 1.3.0 retuned torAddress with trailing \n
    versionInstalled,
  }
}

export function idFromSerial (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}

export enum EmbassyConnection {
  NONE = 'NONE',
  LAN = 'LAN',
  TOR = 'TOR',
}

export enum ServerStatus {
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  UPDATING = 'UPDATING',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RUNNING = 'RUNNING',
}

