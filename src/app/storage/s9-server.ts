import * as CryptoJS from 'crypto-js'
import { HttpService } from '../services/http-service'
import { Method } from 'src/types/enums'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

export class S9Server {
  constructor (
    public readonly id: string,
    public readonly pubkey: string,
    public readonly zeroconfHostname: string,
    public friendlyName: string,
    public handshakeWith: Connexion,
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
      Connexion.NONE,
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
      Connexion.NONE,
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

  get handshakeSuccess (): boolean {
    return this.handshakeWith !== Connexion.NONE
  }

  protocolHost (p: Connexion): string | undefined {
    switch (p) {
      case Connexion.TOR: return this.getTorAddress()
      case Connexion.LAN: return this.getLanIP()
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

  complete (): boolean {
    return !!(this.getTorAddress() && this.getLanIP())
  }
}

export class SetupS9Server extends S9Server {
  constructor (private readonly http: HttpService, s9: S9Server) {
    super(s9.id, s9.pubkey, s9.zeroconfHostname, s9.friendlyName, s9.handshakeWith, s9.torAddress, s9.zeroconfService)
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

