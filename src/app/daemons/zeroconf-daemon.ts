import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { S9Server, zeroconfHostname } from '../models/s9-server'
import { Subscription } from 'rxjs'

@Injectable()
export class ZeroconfDaemon {
  private zeroconfServices: { [hostanme: string]: ZeroconfService } = { }
  private watching: Subscription
  constructor (
    public zeroconf: Zeroconf,
  ) { }

  async stop (): Promise<void> {
    await this.zeroconf.stop()
  }

  async reset (): Promise<void> {
    await this.zeroconf.stop()
    this.watching.unsubscribe() // kills the subscription
    await this.zeroconf.reInit()
    this.watch()
  }

  mock () {
    const zs = {
      domain: 'local.',
      type: '_http._tcp',
      name: 'start9-fb398cc6',
      hostname: '',
      ipv4Addresses: ['192.168.20.1'],
      ipv6Addresses: ['end9823u0ej2fb'],
      port: 5959,
      txtRecord: { },
    }

    this.zeroconfServices[zs.name] = zs
  }

  watch () : void {
    this.watching = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      const { action, service } = result
      console.log(`zeroconf service ${action}`, service)

      if (service.name.startsWith('start9-') && service.ipv4Addresses.concat(service.ipv6Addresses).length > 0) {
        console.log(`discovered start9 server ${service.name}`)

        switch (action) {
          case 'added':
          case 'resolved':
            this.zeroconfServices[service.name] = service
          case 'removed':
            // delete this.zeroconfServices[service.name]
            // no need to delete these... worst case we end up with some extras in the listing of services
            break
          }
        }
      })
  }

  getService (s9: S9Server): ZeroconfService | undefined {
    return this.zeroconfServices[zeroconfHostname(s9)]
  }
}