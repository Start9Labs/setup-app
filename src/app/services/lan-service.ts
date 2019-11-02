import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService, HttpOptions, S9HttpService } from './http-service'
import { LanEnabled, S9Server, ConnectionProtocol, getLanIP } from '../storage/types'

// need a find zeroconffservice shitter
@Injectable()
export class LANService {
  private readonly s9HttpService: (s: S9Server) => S9HttpService
  constructor (
   httpService: HttpService,
  ) {
    this.s9HttpService = (server: S9Server) => new S9HttpService(httpService, server)
  }

  async getTorAddress (server: LanEnabled<S9Server>): Promise<string> {
    return this.s9HttpService(server).request<{ torAddress: string }>(Method.get, getLanIP(server) + '/tor').then(r => r.torAddress)
  }

  async handshake (server: LanEnabled<S9Server>): Promise<boolean> {
    return this.s9HttpService(server).request(Method.post, getLanIP(server) + '/handshake')
      .then(() => true)
      .catch(() => false)
  }
}

