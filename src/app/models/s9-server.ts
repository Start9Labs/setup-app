import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { InstalledApp, AppHealthStatus } from './s9-app'
import { isNullOrUndefined } from 'util'

export type SemVersion = [number, number, number]

export function majorVersion (v : SemVersion): number {
  return v[0]
}

export function semToString (v: SemVersion): string {
  return v.join('.')
}

export function stringToSem (vs: string): SemVersion {
  const toReturn = vs.split('.').map(Number)

  if (toReturn.length !== 3 || toReturn.some(isNaN) || toReturn.some(isNullOrUndefined)) {
    throw new Error(`Agent Version incorrect format: ${vs}`)
  }

  return toReturn as SemVersion
}

export interface S9ServerStorable {
  id: string
  friendlyName: string
  torAddress: string
  zeroconfService: ZeroconfService
  version: SemVersion
}

export interface S9Server extends S9ServerStorable {
  updating: boolean
  status: AppHealthStatus
  statusAt: Date
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
    torAddress,
    zeroconfService,
    version,
    updating: false,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date(),
    privkey,
    apps: [],
    specs: [],
  }

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

export function idFromSerial (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}

export function toS9AgentApp (ss: S9Server): InstalledApp {
  return {
    id: 'start9Agent',
    title: 'Start9 Agent',
    versionLatest: ss.version,
    versionInstalled: ss.version,
    torAddress: ss.torAddress,
    status: ss.status,
    statusAt: ss.statusAt,
    iconURL: 'assets/img/agent.png',
  }
}
