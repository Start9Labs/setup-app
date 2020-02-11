import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { AppModel } from './app-model'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { deriveKeys } from '../util/crypto.util'
import * as CryptoJS from 'crypto-js'
import { BehaviorSubject, Observable, Subject, forkJoin } from 'rxjs'
import { first, take } from 'rxjs/operators'

export type ServerDeltaType = 'Create' | 'Delete' | 'Update'

@Injectable({
  providedIn: 'root',
})
export class ServerModel {
  mapSubject$: MapSubject<S9Server> = new MapSubject({})

  constructor (
    private readonly storage: Storage,
    private readonly appModel: AppModel,
  ) { }

  watchAllOfThem(): ObservableWithId<S9Server>[] {
    return this.mapSubject$.watchAllOfThem()
  }

  watchThem(ids: string[]): ObservableWithId<S9Server>[] {
    return this.mapSubject$.watchThem(ids)
  }

  watchServerAdds(): Observable<S9Server[]> {
    return this.mapSubject$.add$
  }

  watchServerDeletes(): Observable<string[]> {
    return this.mapSubject$.delete$
  }

  watchServer (serverId: string) : BehaviorSubject<S9Server> {
    const toReturn = this.mapSubject$.watchUpdate(serverId)
    if(!toReturn) throw new Error(`Expected server ${serverId} but not found.`)
    return toReturn
  }

  peekServer (serverId: string): S9Server {
    const toReturn = this.mapSubject$.peek(serverId)
    if(!toReturn) throw new Error(`Expected server ${serverId} but not found.`)
    return toReturn
  }

  // no op if missing
  removeFromCache (serverId: string): void {
    this.mapSubject$.delete$.next([serverId])
  }

  // no op if missing
  updateCache (id: string, update: Partial<S9Server>): void {
    this.mapSubject$.update$.next([{...update, id }])
  }

  // no op if already exists
  createInCache (server: S9Server): void {
    this.createServerAppCache(server.id)
    this.mapSubject$.add$.next([server])
  }

  createServerAppCache(sid: string): void {
    this.appModel.createServerCache(sid)
  }

  count (): number { return this.peekAll().length }

  peekAll (): Readonly<S9Server>[] { return this.mapSubject$.peekAll() }

  clearCache () {
    this.mapSubject$.clear()
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    const mapped = fromStorage.map(s => fromStorableServer(s, mnemonic))
    this.mapSubject$.add$.next(mapped)
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

export type ObservableWithId<T> = {id: string, observe$: Observable<T> }
export type Update<T extends {id: string}> = Partial<T> & {id: string}
export class MapSubject<T extends {id: string}> {
  add$: Subject<T[]> = new Subject()
  update$: Subject<Update<T>[]> = new Subject()
  delete$: Subject<string[]> = new Subject()
  subject: {[id: string]: BehaviorSubject<T>}

  constructor(tMap: {[id: string]: T}){
    this.add$.subscribe(toAdd => this.add(toAdd))
    this.update$.subscribe(toUpdate => this.update(toUpdate))
    this.delete$.subscribe(toDeleteId => this.delete(toDeleteId))

    this.subject = Object.entries(tMap).reduce( (acc, [id, t]) => {
      acc[id] = new BehaviorSubject(t)
      return acc
    }, {})
  }

  private add(ts: T[]): void {
    ts.forEach(t => {
      console.log(`adding server ${t.id}`)
      if (!this.subject[t.id]) {
        this.subject[t.id] = new BehaviorSubject(t)
      }
    })
  }

  private delete(tids: string[]): void {
    tids.forEach(id => {
      console.log(`deleting server ${id}`)
      if (this.subject[id]) {
        this.subject[id].complete()
        delete this.subject[id]
      }
    })
  }

  private update(ts: Update<T>[]): void {
    ts.forEach(t => {
      console.log(`updating server ${t.id}`)
      if (this.subject[t.id]) {
        this.subject[t.id].asObservable().pipe(take(1)).subscribe( s => {
          this.subject[t.id].next({...s, ...t})          
        })
      }
    })
  }

  clear(): void {
    this.delete$.next(Object.keys(this.subject))
  }

  watchUpdate(id: string): undefined | BehaviorSubject<T> {
    return this.subject[id]
  }

  peek(id: string): undefined | T {
    return this.subject[id] && this.subject[id].getValue()
  }

  peekAll(): T[] {
    return Object.values(this.subject).map(s => s.getValue())
  }

  watchAllOfThem(): ObservableWithId<T>[] {
    return Object.entries(this.subject).map( ([id, observe$]) => ({ id, observe$ }))
  }

  watchThem(ids: string[]): ObservableWithId<T>[] {
    return ids.map(id => ({id, observe$: this.subject[id]}))
  }
}