import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfDaemon {
  private zeroconfServices: { [hostname: string]: ZeroconfService } = { }
  private zeroconfMonitor: Subscription

  constructor (
    public zeroconf: Zeroconf,
  ) { }

  start () {
    this.zeroconfMonitor = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      const { action, service } = result
      console.log(`zeroconf service ${action}`, service)

      if (service.name.startsWith('start9-') && service.ipv4Addresses.concat(service.ipv6Addresses).length > 0) {
        console.log(`discovered start9 server ${service.name}`)

        switch (action) {
          case 'added':
          case 'resolved':
            this.zeroconfServices[service.name] = service
          case 'removed':
            // no need to delete these... worst case we end up with some extras in the listing of services
            // delete this.zeroconfServices[service.name]
            break
          }
        }
      })
  }

  stop () {
    if (this.zeroconfMonitor) { this.zeroconfMonitor.unsubscribe() } // kills the subscription
  }

  reset () {
    this.zeroconf.reInit()
  }

  getService (s9id: string): ZeroconfService | undefined {
    return this.zeroconfServices[`start9-${s9id}`]
  }

  // @TODO remove
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
}


