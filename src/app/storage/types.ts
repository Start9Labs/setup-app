export class S9Server {
  public readonly secret: string
  public readonly id: string
  public readonly zeroconfHostname: string
  public friendlyName: string
  public connected: ConnectionProtocol
  public torAddress?: string
  public zeroconfService?: ZeroconfService //ipv4 + ipv6 addresses

  constructor (stored : StorableS9Server) {
    const { secret, friendlyName, torAddress, zeroconfService } = stored
    const { id, zeroconfHostname } = identifiersFromSecret(secret)
    this.id = id
    this.zeroconfHostname = zeroconfHostname
    this.friendlyName = friendlyName
    this.torAddress = torAddress
    this.zeroconfService = zeroconfService
    this.connected = ConnectionProtocol.NONE
  }

  toStorableServer (): StorableS9Server {
    return {
      friendlyName: this.friendlyName,
      torAddress: this.torAddress,
      zeroconfService: this.zeroconfService,
    }
  }
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
  torAddress?: string
  // may not be up to date in which case ip communication will fail and we will replace.
  zeroconfService?: ZeroconfService
}

export function identifiersFromSecret (secret: string): { id: string, zeroconfHostname: string } {
  const id = CryptoJS.SHA256(secret).toString().substr(0, 4)
  const zeroconfHostname = `start9-${id}.local`

  return { id, zeroconfHostname }
}

enum ConnectionProtocol {
  TOR,
  LAN,
  NONE,
}

