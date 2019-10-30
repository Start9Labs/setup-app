export interface Start9Server {
  secret: string
  SID: string
  zeroconfHostname: string
  friendlyName: string
  torAddress: string
  ipAddress?: string
  connected?: boolean
}