import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfService, ZeroconfResult } from '@ionic-native/zeroconf/ngx'
import { Subscription } from 'rxjs'
import { Platform } from '@ionic/angular'
import { ServerModel } from '../models/server-model'
import { ServerService } from '../services/server.service'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfDaemon {
  private zeroconfSub: Subscription | undefined

  constructor (
    private readonly platform: Platform,
    private readonly zeroconf: Zeroconf,
    private readonly serverModel: ServerModel,
    private readonly serverService: ServerService,
  ) { }

  async start () {
    // return this.mock()

    if (!this.platform.is('cordova')) { return }

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      await this.handleServiceUpdate(result)
    })
  }

  stop () {
    if (this.zeroconfSub) {
      this.zeroconfSub.unsubscribe()
      this.zeroconfSub = undefined
    }
    this.serverModel.zeroconfServices = { }
  }

  async reset () {
    this.stop()
    await this.zeroconf.reInit()
    this.start()
  }

  async handleServiceUpdate (result: ZeroconfResult) {
    const { action, service } = result
    console.log(`zeroconf service ${action}`, service)

    if (
      service.name.startsWith('start9-')
      && ['added', 'resolved'].includes(action)
      && !this.serverModel.zeroconfServices[service.name]
      && service.ipv4Addresses.concat(service.ipv6Addresses).length > 0
    ) {
      console.log(`discovered start9 server: ${service.name}`)
      this.serverModel.zeroconfServices[service.name] = service
      const server = this.serverModel.getServer(service.name.split('-')[1])
      if (server) {
        const serverRes = await this.serverService.getServer(server)
        Object.assign(server, serverRes)
        await this.serverModel.saveAll()
      }
    }
  }

  // @TODO remove
  async mock () {
    const result: ZeroconfResult = {
      action: 'added',
      service: {
        domain: 'local.',
        type: '_http._tcp',
        name: 'start9-9c56cc51',
        hostname: '',
        ipv4Addresses: ['192.168.20.1'],
        ipv6Addresses: ['end9823u0ej2fb'],
        port: 5959,
        txtRecord: { },
      },
    }

    await this.handleServiceUpdate(result)
  }
}


