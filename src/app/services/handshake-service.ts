import { Injectable } from '@angular/core'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { ServerModel } from '../storage/server-model'
import { LANService } from './lan-service'
import { ConnectionProtocol, S9Server, isTorEnabled, isLanEnabled, TorEnabled, LanEnabled } from '../storage/types'

// attempts to handshake with every lan service for which we have a s9server.
@Injectable()
export class HandshakeService {
  constructor (
    public lanService: LANService,
    public zeroconf: Zeroconf,
    public svm: ServerModel,
  ) { }

  async handshake (ss: S9Server): Promise<S9Server> {
    if (isTorEnabled(ss) && await this.torHandshake(ss as TorEnabled<S9Server>)) {
      console.log(`Successful tor handshake for ${ss.id}`)
      ss.connected = ConnectionProtocol.TOR
      return ss
    }

    if (isLanEnabled(ss) && await this.lanHandshake(ss as LanEnabled<S9Server>)) {
      console.log(`Successful lan handshake for ${ss.id}`)
      ss.torAddress = ss.torAddress || await this.lanService.getTorAddress(ss as LanEnabled<S9Server>)
      ss.connected = ConnectionProtocol.LAN
      return ss
    }

    if (isLanEnabled(ss)) {
      console.log(`Unsuccessful lan handshake for ${ss.id}, but we have ip addresses.`)
      ss.connected = ConnectionProtocol.NONE
      return ss
    }



    //get zeroconf service
      return this.handshake(ss)
  }


  async torHandshake (ss: TorEnabled<S9Server>): Promise<boolean> {
    return false    // TODO when we can actually do tor, actually do tor.
  }

  async lanHandshake (ss: LanEnabled<S9Server>): Promise<boolean> {
    return this.lanService.handshake(ss) // exceptions have been caught.
  }

  // async stop (): Promise<void> {
  //   this.zeroconf.stop()
  // }

  // async reset (): Promise<void> {
  //   await this.stop()
  //   await this.zeroconf.reInit()
  //   this.watch()
  // }

  // async watch (): Promise<void> {
  //   this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
  //     const { action, service } = result

  //     const server = this.dataService.getServerBy({ zeroconfHostname: service.hostname })

  //     if (server) {
  //       switch (action) {
  //         case 'added':
  //         case 'resolved':
  //           const lanServer = server.setLan(service)

  //           if ( await this.lanService.handshake(lanServer) ) {
  //             lanServer.connected = ConnectionProtocol.LAN
  //             lanServer.torAddress = lanServer.torAddress || (await this.lanService.getTorAddress(lanServer))
  //           }

  //           await this.dataService.saveServer(lanServer)
  //           break
  //         case 'removed':
  //           server.connected = ConnectionProtocol.NONE
  //           break
  //       }
  //     }
  //   })
  // }
}