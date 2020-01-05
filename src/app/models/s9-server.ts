import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { AppInstalled, AppHealthStatus, AppEvent } from './s9-app'
import { deriveKeys } from '../util/crypto.util'

export interface S9ServerStorable {
  id: string
  friendlyName: string
  torAddress: string
  zeroconfService: ZeroconfService
  versionInstalled: string
}

export interface S9Server extends S9ServerStorable {
  updating: boolean
  status: AppHealthStatus
  statusAt: Date
  specs: ServerSpecs
  apps: AppInstalled[]
  versionLatest: string
  privkey: string // derive from mnemonic + torAddress
  events: AppEvent[]
}

export type ServerSpecs = { [key: string]: string | number }

export function getLanIP (zcs: ZeroconfService): string  {
  const { ipv4Addresses, ipv6Addresses } = zcs
  return ipv4Addresses.concat(ipv6Addresses)[0] + ':5959'
}

export function fromStorableServer (ss : S9ServerStorable, mnemonic: string[]): S9Server {
  const { friendlyName, torAddress, zeroconfService, id, versionInstalled } = ss
  return {
    id,
    friendlyName,
    torAddress,
    zeroconfService,
    versionInstalled,
    versionLatest: '0.0.0',
    updating: false,
    status: AppHealthStatus.UNKNOWN,
    statusAt: new Date(),
    privkey: deriveKeys(mnemonic, id).privkey,
    apps: [],
    specs: { },
    events: [],
  }
}

export function toStorableServer (ss: S9Server): S9ServerStorable {
  const { friendlyName, torAddress, zeroconfService, id, versionInstalled } = ss

  return {
    id,
    friendlyName,
    torAddress,
    zeroconfService,
    versionInstalled,
  }
}

export function idFromSerial (serialNo: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(serialNo).toString(CryptoJS.enc.Hex).substr(0, 8)
}
