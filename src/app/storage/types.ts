import * as CryptoJS from 'crypto-js'
import { HttpService } from '../services/http-service'
import { Method } from 'src/types/enums'

export class S9Server {
  constructor (
    public readonly id: string,
    public readonly pubkey: string,
    public readonly zeroconfHostname: string,
    public friendlyName: string,
    public connected: ConnectionProtocol,
    public torAddress?: string,
    public zeroconfService?: ZeroconfService,
  ) { }

  static fromUserInput (id: string, friendlyName: string, pubkey: string): S9Server {
    const zeroconfHostname = hostnameFromId(id)
    return new S9Server(
      id,
      pubkey,
      zeroconfHostname,
      friendlyName,
      ConnectionProtocol.NONE,
    )
  }

  static fromStoredServer (ss : StorableS9Server) : S9Server {
    const { friendlyName, torAddress, zeroconfService, id, pubkey } = ss
    const zeroconfHostname = hostnameFromId(id)
    return new S9Server(
      id,
      pubkey,
      zeroconfHostname,
      friendlyName,
      ConnectionProtocol.NONE,
      torAddress,
      zeroconfService,
    )
  }

  toStorableServer (): StorableS9Server {
    return {
      id: this.id,
      pubkey: this.pubkey,
      friendlyName: this.friendlyName,
      torAddress: this.torAddress,
      zeroconfService: this.zeroconfService,
    }
  }

  update (update: Partial<S9Server>): void {
    Object.entries(update).forEach( ([k, v]) => {
      this[k] = v
    })
  }

  async handshake (p: ConnectionProtocol, httpService: HttpService) : Promise<boolean> {
    const host = this.protocolHost(p)
    if (host) {
      return httpService.request(Method.post, host + '/handshake')
        .then(() => {
          this.update({ connected: p})
          return true
        })
        .catch(() => false)
    } else {
      return false
    }
  }

  async setup (httpService: HttpService): Promise<void> {
    if (this.connected === ConnectionProtocol.TOR) return
    if (this.connected === ConnectionProtocol.LAN && !this.protocolHost(ConnectionProtocol.TOR)) {
      // get tor address over lan
      // success here will get picked up by handshake daemon
    }
    if (!this.protocolHost(ConnectionProtocol.LAN)) {
      // get lan stuff, recall setup function to promote through tor
    }
  }

  private protocolHost (p: ConnectionProtocol): string | undefined {
    switch (p) {
      case ConnectionProtocol.TOR: return this.getTorAddress()
      case ConnectionProtocol.LAN: return this.getLanIP()
      default: undefined
    }
  }

  getTorAddress (): string | undefined {
    return this.torAddress
  }

  getLanIP (): string | undefined  {
    if (this.zeroconfService) {
      const { ipv4Addresses, ipv6Addresses } = this.zeroconfService
      return ipv4Addresses.concat(ipv6Addresses)[0]
    }
    return undefined
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

