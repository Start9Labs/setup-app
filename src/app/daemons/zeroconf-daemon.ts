import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfResult, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription } from 'rxjs'
import { Platform } from '@ionic/angular'
import { ServerModel } from '../models/server-model'
import { ServerDaemon } from './server-daemon'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfDaemon {
  services: { [hostname: string]: ZeroconfService } = { }
  private zeroconfSub: Subscription | undefined

  constructor (
    private readonly platform: Platform,
    private readonly zeroconf: Zeroconf,
    private readonly serverModel: ServerModel,
    private readonly serverDaemon: ServerDaemon,
  ) { }

  init () {
    this.start()
  }

  async start (reInit = false) {
    // return this.mock()

    if (!this.platform.is('cordova')) { return }

    if (reInit) { await this.zeroconf.reInit() }

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      this.handleServiceUpdate(result)
    })
  }

  stop () {
    if (this.zeroconfSub) {
      this.zeroconfSub.unsubscribe()
      this.zeroconfSub = undefined
    }
    this.services = { }
  }

  handleServiceUpdate (result: ZeroconfResult) {
    const { action, service } = result
    console.log(`zeroconf service ${action}`, service)

    if (
      service.name.startsWith('start9-')
      && action === 'resolved'
      && service.ipv4Addresses.length
    ) {
      console.log(`discovered start9 server: ${service.name}`)
      this.services[service.name] = service
      const server = this.serverModel.getServer(service.name.split('-')[1])
      if (server) {
        server.zeroconf = service
        this.serverDaemon.syncServer(server)
      }
    }
  }

  getService (serverId: string): ZeroconfService | undefined {
    return this.services[`start9-${serverId}`]
  }

  // @TODO remove
  async mock () {
    const result: ZeroconfResult = {
      action: 'resolved',
      service: {
        domain: 'local.',
        type: '_http._tcp',
        name: 'start9-1f3ce404',
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


