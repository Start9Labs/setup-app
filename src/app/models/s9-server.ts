import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { InstalledApp, toS9AgentApp } from './s9-app'

export interface S9Server {
  id: string
  friendlyName: string

  lastStatusAttempt: AppStatusAttempt
  version: string

  apps: InstalledApp[]

  privkey: string // derive from mnemonic + torAddress

  torAddress: string
  zeroconfService: ZeroconfService
}

export interface Storable9SServer {
  id: string
  friendlyName: string

  torAddress: string
  zeroconfService: ZeroconfService
}

export function getLanIP (zcs: ZeroconfService): string  {
  const { ipv4Addresses, ipv6Addresses } = zcs
  return ipv4Addresses.concat(ipv6Addresses)[0] + ':5959'
}


export function fromStorableServer (ss : S9ServerStorable, privkey: string): S9Server {
  console.log(ss)
  const { friendlyName, torAddress, zeroconfService, id, version } = ss
  const toReturn: S9Server = {
    id,
    friendlyName,
    lastStatusAttempt: unknownAppStatusAttempt(),
    privkey,
    torAddress,
    zeroconfService,
    apps: [],
    version,
  }

  toReturn.apps.push(toS9AgentApp(toReturn))

  return toReturn
}

export function toStorableServer (ss: S9Server): S9ServerStorable {
  const { friendlyName, torAddress, zeroconfService, id, version } = ss

  return {
    id,
    friendlyName,
    torAddress,
    zeroconfService,
    version,
  }
}

export type AppStatusAttempt = {
  status: AppHealthStatus, timestamp: Date
}

export enum AppHealthStatus {
  running = 'running',
  stopped = 'stopped',
  notfound = 'notfound',
  unreachable = 'unreachable',
  unknown = 'unknown',
  uninstalled = 'uninstalled', // server should not respond with this
}

export function unknownAppStatusAttempt (ts: Date = new Date()): AppStatusAttempt {
  return { status: AppHealthStatus.unknown, timestamp: ts }
}

export interface S9ServerStorable {
  id: string
  friendlyName: string
  torAddress: string
  zeroconfService: ZeroconfService
  version: string
}

export function idFromSerial (serialNo: string): string {
  return CryptoJS.SHA256(serialNo).toString().substr(0, 8)
}
