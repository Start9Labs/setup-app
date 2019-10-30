export interface Start9Server {
  secret: string // ap mode secret
  SSID: string // ap mode ssid
  zeroconfHostname: string //ssid.local
  friendlyName: string
  torAddress?: string
  ipAddress?: string
  connected?: boolean
}