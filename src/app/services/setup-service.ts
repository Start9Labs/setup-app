import { Injectable } from '@angular/core'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { ServerModel } from '../storage/server-model'
import { ConnectionProtocol, S9Server } from '../storage/types'
import { HttpService } from './http-service'

// attempts to handshake with every lan service for which we have a s9server.
@Injectable()
export class SetupService {
  constructor (
    public httpService: HttpService,
    public zeroconf: Zeroconf,
    public svm: ServerModel,
  ) { }

  async setupLoop (): Promise<boolean[]> {
    const sss = this.svm.getServers()
    return Promise.all(sss.map(ss => this.handshake(ss)))
  }

  async setup (ss: S9Server): Promise<boolean> {
    return await ss.handshake(ConnectionProtocol.TOR, this.httpService)
        || await ss.handshake(ConnectionProtocol.LAN, this.httpService)
  }
}