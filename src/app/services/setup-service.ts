import { Injectable } from '@angular/core'
import { Connexion, S9Server, updateS9, getLanIP, protocolHost } from '../storage/s9-server'
import { HttpService } from './http-service'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { Method } from 'src/types/enums'

@Injectable()
export class SetupService {
  constructor (
    private readonly httpService: HttpService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async setup (ss: S9Server): Promise<S9Server> {
    let updates = { } as Partial<S9Server>
    if (!getLanIP(ss)) {
      updates.handshakeWith = await this.handshakeWith(Connexion.LAN, ss),
      updates.zeroconfService = this.zeroconfDaemon.getService(ss)
    }

    if (!ss.torAddress && getLanIP(ss) && ss.handshakeWith === Connexion.LAN) {
      const { torAddress } = await this.httpService.request<{ torAddress: string }>(Method.get, getLanIP(ss) + '/tor')
      updates.torAddress = torAddress
      updates.handshakeWith = await this.handshakeWith(Connexion.TOR, ss)
    }

    return updateS9(ss, updates)
  }

  async handshake (ss: S9Server): Promise<S9Server> {
    const torConnexion = await this.handshakeWith(Connexion.TOR, ss)
    if (torConnexion === Connexion.TOR) {
      return updateS9(ss, { handshakeWith: torConnexion })
    }

    const lanConnexion = await this.handshakeWith(Connexion.LAN, ss)
    if (lanConnexion === Connexion.LAN) {
      return updateS9(ss, { handshakeWith: lanConnexion })
    }

    return updateS9(ss, { handshakeWith: Connexion.NONE})
  }

  async handshakeWith (p: Connexion, ss: S9Server) : Promise<Connexion> {
    const lastHandshake = ss.handshakeWith
    const host = protocolHost(ss, p)
    if (host) {
      try {
        await this.httpService.request(Method.post, host + '/handshake')
        return p
      } catch (e) {
        console.error(`failed handhsake ${e.message}`)
        if (lastHandshake === p) {
          return Connexion.NONE
        }
      }
    }
    return ss.handshakeWith
  }
}