import { Injectable } from '@angular/core'
import { Network } from '@ionic-native/network/ngx'
import { Subscription } from 'rxjs'
import { ZeroconfDaemon } from './zeroconf-daemon'

// detects when phone changes wifi network
@Injectable({
  providedIn: 'root',
})
export class WifiDaemon {
  private connectionMonitor: Subscription | undefined
  private disconnectionMonitor: Subscription | undefined

  constructor (
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly network: Network,
  ) { }

  start () {
    if (!this.connectionMonitor) { this.enableConnectionMonitor() }
    if (!this.disconnectionMonitor) { this.enableDisconnectionMonitor() }
  }

  stop () {
    if (this.connectionMonitor) { this.connectionMonitor = undefined }
    if (this.disconnectionMonitor) { this.disconnectionMonitor = undefined }
  }

  enableConnectionMonitor () {
    this.connectionMonitor = this.network.onConnect().subscribe(() => {
      console.log('network connected')
      this.manageZeroconfDaemon()
    })
  }

  enableDisconnectionMonitor () {
    this.disconnectionMonitor = this.network.onDisconnect().subscribe(() => {
      console.log('network disconnected')
      this.zeroconfDaemon.stop()
    })
  }

  private manageZeroconfDaemon () {
    let pollingForConnection = setInterval(() => {
      console.log('polling for network')
      if (this.network.type !== 'none') {
        clearInterval(pollingForConnection)
        if (this.network.type === 'wifi') {
          console.log('connected to wifi')
          this.zeroconfDaemon.reset()
        }
      }
    }, 500)
  }
}