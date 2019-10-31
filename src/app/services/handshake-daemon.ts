import { Injectable } from '@angular/core'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { DataService } from './data-service'
import { LANService } from './lan-service'
import { enableLAN } from 'src/types/misc'

// attempts to handshake with every lan service for which we have a s9server.
@Injectable()
export class HandshakeDaemon {
  constructor (
    public lanService: LANService,
    public zeroconf: Zeroconf,
    public dataService: DataService,
  ) { }

  async stop (): Promise<void> {
    this.zeroconf.stop()
  }

  async reset (): Promise<void> {
    await this.stop()
    await this.zeroconf.reInit()
    this.watch()
  }

  async watch (): Promise<void> {
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      const { action, service } = result

      const server = this.dataService.getServerBy({ zeroconfHostname: service.hostname })

      if (server) {
        switch (action) {
          case 'added':
          case 'resolved':
            const lanServer = enableLAN(server, service.ipv4Addresses[0])
            lanServer.connected = await this.lanService.handshake(lanServer)
            await this.dataService.saveServer(lanServer)
            break
          case 'removed':
            server.connected = false
            break
        }
      }
    })
  }
}