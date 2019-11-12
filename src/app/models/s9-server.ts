import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { InstalledApp, companionApp } from './s9-app'

export interface S9ServerBuilder {
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

export interface S9ServerLan extends S9ServerBuilder {
  zeroconfService: ZeroconfService
}

export interface S9ServerTor extends S9ServerBuilder {
  torAddress: string
}

export interface S9Server extends S9ServerTor {
  privkey: string
  pubkey: string
}

export function isTorEnabled (ss: S9ServerBuilder): ss is S9ServerTor {
  return !!ss.torAddress
}

export function hasAll (ss: S9ServerBuilder): ss is S9Server {
  return isTorEnabled(ss) && hasKeys(ss) && ss.registered
}

export function hasKeys (ss: S9ServerBuilder): ss is S9Server {
  return !!ss.pubkey && !!ss.pubkey
}

export function isFullySetup (ss: S9ServerBuilder): ss is S9Server {
  return !!getLanIP(ss) && ss.registered && ss.lastHandshake.success && !!ss.torAddress
}

export function isLanEnabled (ss: S9ServerBuilder): ss is S9ServerLan {
  return !!getLanIP(ss)
}

export function updateS9 (ss: S9Server, u: Partial<S9ServerBuilder>): S9Server {
  return { ...ss, ...u }
}

// careful with this...
export function updateS9_MUT (ss: S9ServerBuilder, u: Partial<S9ServerBuilder>): void {
  Object.entries(u).forEach(([k, v]) => {
    ss[k] = v
  })
}

export function zeroconfHostname (ss: S9ServerBuilder): string {
  return hostnameFromId(ss.id)
}

export function getLanIP (ss: S9ServerBuilder): string | undefined  {
  if (ss.zeroconfService) {
    const { ipv4Addresses, ipv6Addresses } = ss.zeroconfService
    return ipv4Addresses.concat(ipv6Addresses)[0] + ':5959'
  }
  return undefined
}

export function fromUserInput (id: string, friendlyName: string): S9ServerBuilder {
    return {
      id,
      friendlyName,
      lastHandshake: initHandshakeStatus(),
      registered: false,
      apps: [],
    }
  }

export function fromStorableServer (ss : StorableS9Server): S9ServerBuilder {
  const { registered, friendlyName, torAddress, zeroconfService, id } = ss
  const toReturn = {
    id,
    friendlyName,
    lastHandshake: initHandshakeStatus(),
    torAddress,
    zeroconfService,
    registered,
    apps: [],
  }

  if (isTorEnabled(toReturn)) {
    toReturn.apps.push(companionApp(toReturn))
  }

  return toReturn
}

export function toStorableServer (ss: S9ServerBuilder): StorableS9Server {
  const { registered, friendlyName, torAddress, zeroconfService, id } = ss

  return {
    id,
    friendlyName,
    torAddress,
    zeroconfService,
    registered,
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
}

export function idFromSerial (serialNo: string): string {
  return CryptoJS.SHA256(serialNo).toString().substr(0, 8)
}

function hostnameFromId (id: string) {
  return `start9-${id}`
}