import * as CryptoJS from 'crypto-js'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

export interface S9Server {
  id: string
  pubkey: string
  zeroconfHostname: string
  friendlyName: string
  handshakeWith: Connexion
  torAddress?: string
  zeroconfService?: ZeroconfService
}

export function updateS9 (ss: S9Server, u: Partial<S9Server>): S9Server {
  return { ...ss, ...u }
}

export function isFullySetup (ss: S9Server) : boolean {
  return !!(ss.torAddress && getLanIP(ss))
}

export function protocolHost (ss: S9Server, p: Connexion): string | undefined {
  switch (p) {
    case Connexion.TOR: return ss.torAddress
    case Connexion.LAN: return getLanIP(ss)
    default: undefined
  }
}

export function getLanIP (ss: S9Server): string | undefined  {
  if (ss.zeroconfService) {
    const { ipv4Addresses, ipv6Addresses } = ss.zeroconfService
    return ipv4Addresses.concat(ipv6Addresses)[0]
  }
  return undefined
}

export function fromUserInput (id: string, friendlyName: string, pubkey: string): S9Server {
    const zeroconfHostname = hostnameFromId(id)
    return {
      id,
      pubkey,
      zeroconfHostname,
      friendlyName,
      handshakeWith: Connexion.NONE,
    }
  }

export function fromStoredServer (ss : StorableS9Server) : S9Server {
    const { friendlyName, torAddress, zeroconfService, id, pubkey } = ss
    const zeroconfHostname = hostnameFromId(id)
    return {
      id,
      pubkey,
      zeroconfHostname,
      friendlyName,
      handshakeWith: Connexion.NONE,
      torAddress,
      zeroconfService,
    }
  }

export function toStorableServer (ss: S9Server): StorableS9Server {
  return {
    id: ss.id,
    pubkey: ss.pubkey,
    friendlyName: ss.friendlyName,
    torAddress: ss.torAddress,
    zeroconfService: ss.zeroconfService,
  }
}


export interface StorableS9Server {
  id: string
  friendlyName: string
  pubkey: string
  torAddress?: string
  // may not be up to date in which case ip communication will fail and we will replace.
  zeroconfService?: ZeroconfService
}

export function idFromSerial (serialNo: string): string {
  return CryptoJS.SHA256(serialNo).toString().substr(0, 6)
}

export function hostnameFromId (id: string) {
  return `start9-${id}.local`
}

export enum Connexion {
  TOR,
  LAN,
  NONE,
}

