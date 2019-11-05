import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { S9Server, zeroconfHostname } from '../storage/s9-server'
import { Subscription } from 'rxjs'

@Injectable()
export class ZeroconfDaemon {
  private zeroconfServices: { [zeroconfHostname: string]: ZeroconfService } = { }
  private watching: Subscription
  constructor (
    public zeroconf: Zeroconf,
  ) { }

  async stop (): Promise<void> {
    await this.zeroconf.stop()
  }

  async reset (): Promise<void> {
    await this.zeroconf.stop()
    await this.watching.unsubscribe() // kills the subscription
    await this.zeroconf.reInit()
    this.watch()
  }

  watch () : void {
    this.watching = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      const { action, service } = result
      console.log(`acquired new service`)

      if (service.hostname.startsWith('start9-')) {
        console.log(`acquired new start9 server ${service.hostname}`)

        switch (action) {
          case 'added':
          case 'resolved':
            this.zeroconfServices[service.hostname] = service
          case 'removed':
            // delete this.zeroconfServices[service.hostname]
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