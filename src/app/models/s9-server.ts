import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { InstalledApp, fromStorableApp } from './s9-app'

export interface S9Server {
  id: string
  friendlyName: string
  lastHandshake: HandshakeAttempt
  registered: boolean
  apps: InstalledApp[]
  privkey?: string
  pubkey?: string
  torAddress?: string
  zeroconfService?: ZeroconfService
}

export interface S9ServerLan extends S9Server {
  zeroconfService: ZeroconfService
}

export interface S9ServerFull extends S9ServerLan {
  torAddress: string
  privkey: string
  pubkey: string
}

export function hasKeys (ss: S9Server): ss is S9ServerFull {
  return !!ss.pubkey && !!ss.pubkey
}

export function isFullySetup (ss: S9Server): ss is S9ServerFull {
  return !!getLanIP(ss) && ss.registered && ss.lastHandshake.success && !!ss.torAddress
}

export function isLanEnabled (ss: S9Server | S9ServerLan): ss is S9ServerLan {
  return !!getLanIP(ss)
}

export function updateS9 (ss: S9ServerFull, u: Partial<S9Server>): S9ServerFull {
  return { ...ss, ...u }
}

// careful with this...
export function updateS9_MUT (ss: S9Server, u: Partial<S9Server>): void {
  Object.entries(u).forEach(([k, v]) => {
    ss[k] = v
  })
}

export function zeroconfHostname (ss: S9Server): string {
  return hostnameFromId(ss.id)
}

export function getLanIP (ss: S9Server): string | undefined  {
  if (ss.zeroconfService) {
    const { ipv4Addresses, ipv6Addresses } = ss.zeroconfService
    return ipv4Addresses.concat(ipv6Addresses)[0] + ':5959'
  }
  return undefined
}

export function fromUserInput (id: string, friendlyName: string): S9Server {
    return {
      id,
      friendlyName,
      lastHandshake: initHandshakeStatus(),
      registered: false,
      apps: [],
    }
  }

export function fromStorableServer (ss : StorableS9Server): S9Server {
  const { registered, friendlyName, torAddress, zeroconfService, id, apps } = ss
  return {
    id,
    friendlyName,
    lastHandshake: initHandshakeStatus(),
    torAddress,
    zeroconfService,
    registered,
    apps: apps.map(app => fromStorableApp(app)),
  }
}

export function toStorableServer (ss: S9Server): StorableS9Server {
  const { registered, friendlyName, torAddress, zeroconfService, id, apps } = ss
  return {
    id,
    friendlyName,
    torAddress,
    zeroconfService,
    registered,
    apps,
  }
}

export type HandshakeAttempt = { success: boolean, timestamp: Date }

export function initHandshakeStatus (): HandshakeAttempt {
  return { success: false, timestamp: new Date() }
}

export interface StorableS9Server {
  id: string
  friendlyName: string
  registered: boolean
  torAddress?: string
  // may not be up to date in which case ip communication will fail and we will replace.
  zeroconfService?: ZeroconfService
  apps: InstalledApp[]
}

export function idFromSerial (serialNo: string): string {
  return CryptoJS.SHA256(serialNo).toString().substr(0, 8)
}

function hostnameFromId (id: string) {
  return `start9-${id}`
}
