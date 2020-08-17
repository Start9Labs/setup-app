import { Injectable } from '@angular/core'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { Platform } from '@ionic/angular'
import { NetworkMonitor } from '../network.service'
import { ZeroconfMonitor } from './zeroconf.service'

@Injectable()
export class LiveZeroconfMonitor extends ZeroconfMonitor {
  constructor (
    platform: Platform,
    zeroconf: Zeroconf,
    networkMonitor: NetworkMonitor,
  ) { super(platform, zeroconf, networkMonitor) }

  async start (): Promise<void> {
    if (!this.platform.is('ios') && !this.platform.is('android')) { return }

    console.log('starting zeroconf monitor')

    await this.zeroconf.reInit()

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      this.handleServiceUpdate(result)
    })
  }
}
