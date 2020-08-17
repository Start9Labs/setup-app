

import { Injectable } from '@angular/core'
import { ZeroconfResult, Zeroconf } from '@ionic-native/zeroconf/ngx'
import { NetworkMonitor } from '../network.service'
import { Platform } from '@ionic/angular'
import { ZeroconfMonitor } from './zeroconf.service'

@Injectable()
export class MockZeroconfMonitor extends ZeroconfMonitor {
  constructor (
    platform: Platform,
    zeroconf: Zeroconf,
    networkMonitor: NetworkMonitor,
  ) { super(platform, zeroconf, networkMonitor) }

  async start (): Promise<void> {
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
    this.handleServiceUpdate(result)
  }
}
