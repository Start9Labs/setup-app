import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { InstalledApp, AppHealthStatus, AppStatusAttempt } from './s9-app'

export interface S9ServerStorable {
  id: string
  friendlyName: string
  torAddress: string
  zeroconfService: ZeroconfService
  version: string
}

export interface S9Server extends S9ServerStorable {
  lastStatusAttempt: AppStatusAttempt
  specs: ServerSpec[]
  apps: InstalledApp[]
  privkey: string // derive from mnemonic + torAddress
}

export interface ServerSpec {
  name: string
  value: string
}

export function getLanIP (zcs: ZeroconfService): string  {
  const { ipv4Addresses, ipv6Addresses } = zcs
  return ipv4Addresses.concat(ipv6Addresses)[0] + ':5959'
}

export function fromStorableServer (ss : S9ServerStorable, privkey: string): S9Server {
  const { friendlyName, torAddress, zeroconfService, id, version } = ss
  const toReturn: S9Server = {
    id,
    friendlyName,
    lastStatusAttempt: unknownAppStatusAttempt(),
    privkey,
    torAddress,
    zeroconfService,
    apps: [],
    specs: [],
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

export function unknownAppStatusAttempt (ts: Date = new Date()): AppStatusAttempt {
  return { status: AppHealthStatus.UNKNOWN, timestamp: ts }
}

export function idFromSerial (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}

export function toS9AgentApp (ss: S9Server): InstalledApp {
  return {
    id: 'start9Agent',
    title: 'Start9 Agent',
    versionInstalled: ss.version,
    torAddress: ss.torAddress,
    lastStatus: ss.lastStatusAttempt,
    iconURL: 'assets/img/agent.png',
  }
}
