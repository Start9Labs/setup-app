import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService, S9HttpService, mapERes, Res } from './http-service'
import { LanEnabled, S9Server, ConnectionProtocol, getLanIP } from '../storage/types'

// need a find zeroconffservice shitter
@Injectable()
export class LANService {
  private readonly s9HttpService: S9HttpService
  constructor (
   httpService: HttpService,
  ) {
    this.s9HttpService = new S9HttpService(httpService, ConnectionProtocol.LAN)
  }

  async getTorAddress (server: LanEnabled<S9Server>): Promise<Res<S9Server, string>> {
    return this.s9HttpService.request<{ torAddress: string}>(Method.get, 'tor')(server)
      .then(({ state, val}) => ({ state, val: val.torAddress }))
  }

  // can't fail
  async handshake (server: LanEnabled<S9Server>): Promise <Res<S9Server, boolean>> {
    return this.s9HttpService.request(Method.post, 'handshake')(server)
      .then(res => ({ state: res.state, val: true}))
      .catch(res => {
        console.error(res.err)
        return { state: res.state, val: false}
      })
  }
}

