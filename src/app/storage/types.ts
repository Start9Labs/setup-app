import * as CryptoJS from 'crypto-js'

export interface S9Server {
  readonly id: string,
  readonly pubkey: string,
  readonly zeroconfHostname: string,
  friendlyName: string,
  connected: ConnectionProtocol,
  torAddress?: string,
  zeroconfService?: ZeroconfService, //ipv4 + ipv6 addresses
}

export function updateS9Server (s: S9Server, update: Partial<S9Server>): S9Server {
  return { ...s, ...update}
}

export function fromUserInput (id: string, friendlyName: string, pubkey: string): S9Server {
  const zeroconfHostname = hostnameFromId(id)
  return {
    id,
    pubkey,
    zeroconfHostname,
    friendlyName,
    connected: ConnectionProtocol.NONE,
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
    connected: ConnectionProtocol.NONE,
    torAddress,
    zeroconfService,
  }
}

export function toStorableServer (s9Server: S9Server): StorableS9Server {
  return {
    id: s9Server.id,
    pubkey: s9Server.pubkey,
    friendlyName: s9Server.friendlyName,
    torAddress: s9Server.torAddress,
    zeroconfService: s9Server.zeroconfService,
  }
}

export type LanEnabled<T> = T & { zeroconfService: ZeroconfService}
export function enableLan<T extends S9Server> (t: T, s: ZeroconfService): LanEnabled<T> {
  return { ...t, zeroconfService: s}
}

export function getLanIP<T extends { zeroconfService: ZeroconfService}> ( t: T ): string {
  const { ipv4Addresses, ipv6Addresses } = t.zeroconfService
  return ipv4Addresses.concat(ipv6Addresses)[0]
}

export function isLanEnabled<T extends S9Server> (t: T): boolean {
  return !!t.zeroconfService
}

export type TorEnabled<T extends S9Server> = T & { torAddress: string}
export function enableTor<T extends S9Server> (t: T, torAddress: string): TorEnabled<T> {
  return { ...t, torAddress }
}

export function getTorAddress<T extends { torAddress: string}> ( t: T ): string {
  return t.torAddress
}

export function getProtocolHost (s: S9Server, cp: ConnectionProtocol): string | undefined {
  switch (cp) {
    case ConnectionProtocol.TOR:
      if (isTorEnabled(s)) {
        return getTorAddress(s as TorEnabled<S9Server>)
      } break
    case ConnectionProtocol.LAN:
      if (isLanEnabled(s)) {
        return getLanIP(s as LanEnabled<S9Server>)
      } break
    default:
      return undefined
  }
}

export function isTorEnabled<T extends S9Server> (t: T): boolean {
  return !!t.torAddress
}

export type ZeroconfService = {
  domain: string
  type: string
  name: string
  port: number
  hostname: string
  ipv4Addresses: string[]
  ipv6Addresses: string[]
  txtRecord: { [key: string]: string}
}

export interface StorableS9Server {
  id: string
  friendlyName: string
  pubkey: string
  torAddress?: string
  // may not be up to date in which case ip communication will fail and we will replace.
  zeroconfService?: ZeroconfService
}

export function identifiersFromSerial (serialNo: string): { id: string, zeroconfHostname: string } {
  const id = CryptoJS.SHA256(serialNo).toString().substr(0, 4)
  const zeroconfHostname = hostnameFromId(id)
  return { id, zeroconfHostname }
}

export function hostnameFromId (id: string) {
  return `start9-${id}.local`
}

export enum ConnectionProtocol {
  TOR,
  LAN,
  NONE,
}

