import * as CryptoJS from 'crypto-js'

export interface Start9Server {
  secret: string // ap mode secret
  ssid: string // ap mode ssid
  zeroconfHostname: string //ssid.local
  friendlyName?: string
  torAddress?: string
  ipAddress?: string
  connected?: boolean
}

export function enableLAN<T extends Start9Server> (t: T, ipAddress: string): T & { ipAddress: string } {
  return Object.assign(t, { ipAddress })
}

export function enableTor<T extends Start9Server> (t: T, torAddress: string): T & { torAddress: string } {
  return Object.assign(t, { torAddress })
}

export function identifiersFromSecret (secret: string): Start9Server {
  const first4 = CryptoJS.SHA256(secret).toString().substr(0, 4)
  const ssid = `start9-${first4}`
  const zeroconfHostname = `${ssid}.local`

  return { ssid, zeroconfHostname, secret }
}

export function getServerName (server: Start9Server): string {
  return server.friendlyName || server.ssid
}

export type LANStart9Server = Start9Server & { ipAddress: string }
export type TORStart9Server = Start9Server & { torAddress: string }