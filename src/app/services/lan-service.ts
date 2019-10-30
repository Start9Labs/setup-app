import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService } from './http-service'
import { Start9Server } from 'src/types/misc'
import { ZeroconfService, Zeroconf } from '@ionic-native/zeroconf/ngx'
import { DataService } from './data-service'

@Injectable()
export class LANService {
  services: ZeroconfService[] = []
  currentServer: Start9Server

  constructor (
    public httpService: HttpService,
    public zeroconf: Zeroconf,
    public dataService: DataService,
  ) { }

  watch () {
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      const { action, service } = result

      const index = this.services.findIndex(s => s.hostname === service.hostname)
      if (index === -1) {
        this.services.push(service)
      } else {
        this.services[index] = service
      }

      console.log(this.services)

      if (service.hostname.startsWith('start9-')) {
        const server = this.dataService.getServer(service.hostname)
        if (server) {
          switch (action) {
            case 'added':
            case 'resolved':
              server.ipAddress = service.ipv4Addresses[0]
              await this.dataService.saveServer(server)
              if (await this.handshake(server)) {
                server.connected = true
              }
              break
            case 'removed':
              server.connected = false
              break
          }
        }
      }
    })
  }

  private async handshake (server?: Start9Server): Promise<boolean> {
    const ipAddress = server ? server.ipAddress : this.currentServer.ipAddress
    return this.httpService.request(Method.post, ipAddress + '/handshake')
      .then(() => true)
      .catch(() => false)
  }
}