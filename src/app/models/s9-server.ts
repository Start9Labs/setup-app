import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

export interface S9Server {
  id: string
  friendlyName: string
  lastHandshake: HandshakeAttempt
  registered: boolean
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

export function updateS9 (ss: S9Server, u: Partial<S9Server>): S9Server {
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
    return ipv4Addresses.concat(ipv6Addresses)[0]
  }
  return undefined
}

export function fromUserInput (id: string, friendlyName: string): S9Server {
    return {
      id,
      friendlyName,
      lastHandshake: initHandshakeStatus(),
      registered: false,
    }
  }

export function fromStoredServer (ss : StorableS9Server) : S9Server {
    const { registered, friendlyName, torAddress, zeroconfService, id } = ss
    return {
      id,
      friendlyName,
      lastHandshake: initHandshakeStatus(),
      torAddress,
      zeroconfService,
      registered,
    }
  }

export function toStorableServer (ss: S9Server): StorableS9Server {
  return {
    id: ss.id,
    friendlyName: ss.friendlyName,
    torAddress: ss.torAddress,
    zeroconfService: ss.zeroconfService,
    registered: ss.registered,
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
  return `start9-${id}.local`
}
