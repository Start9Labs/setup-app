import { Injectable } from '@angular/core'
import { Connexion, S9Server } from '../storage/s9-server'
import { HttpService } from './http-service'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { Method } from 'src/types/enums'

// attempts to handshake with every lan service for which we have a s9server.
@Injectable()
export class SetupService {
  constructor (
    private readonly httpService: HttpService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async setup (ss: S9Server): Promise<S9Server> {
    if (!ss.getLanIP()) {
      ss.update( { zeroconfService: this.zeroconfDaemon.getService(ss) } )
      ss.update(await this.handshakeWith(Connexion.LAN, ss))
    }

    if (!ss.getTorAddress() && ss.getLanIP() && ss.handshakeWith === Connexion.LAN) {
      ss.update(await this.httpService.request<{ torAddress: string }>(Method.get, ss.getLanIP() + '/tor'))
      ss.update(await this.handshakeWith(Connexion.TOR, ss))
    }

    return ss
  }

  async handshakeWith (p: Connexion, ss: S9Server) : Promise<{ handshakeWith: Connexion }> {
    const lastHandshake = ss.handshakeWith
    const host = ss.protocolHost(p)
    if (host) {
      try {
        await this.httpService.request(Method.post, host + '/handshake')
        return { handshakeWith: p}
      } catch (e) {
        console.error(`failed handhsake ${e.message}`)
        if (lastHandshake === p) {
          return { handshakeWith: Connexion.NONE }
        }
      }
    }
    return { handshakeWith: ss.handshakeWith }
  }

  async handshake (ss: S9Server): Promise<S9Server> {
    const torHandshake = await this.handshakeWith(Connexion.TOR, ss)

    if (torHandshake.handshakeWith === Connexion.TOR) {
      ss.update(torHandshake)
      return ss
    }

    const lanHandshake = await this.handshakeWith(Connexion.LAN, ss)
    if (lanHandshake.handshakeWith === Connexion.LAN) {
      ss.update(lanHandshake)
      return ss
    }

    return ss
  }
}