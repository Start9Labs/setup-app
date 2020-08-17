import { config } from '../../config'
import { MockZeroconfMonitor } from './mock-zeroconf.service'
import { LiveZeroconfMonitor } from './live-zeroconf.service'
import { Platform } from '@ionic/angular'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { NetworkMonitor } from '../network.service'

export function ZeroconfMonitorFactory (
    platform: Platform,
    zeroconf: Zeroconf,
    networkMonitor: NetworkMonitor,
) {
  if (config.zeroconf.useMocks) {
    return new MockZeroconfMonitor(platform, zeroconf, networkMonitor)
  } else {
    return new LiveZeroconfMonitor(platform, zeroconf, networkMonitor)
  }
}
