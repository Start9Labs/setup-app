import { Injectable } from '@angular/core'
import { Network } from '@ionic-native/network/ngx'
import { Subscription } from 'rxjs'
import { ZeroconfDaemon } from './zeroconf-daemon'

// detects when phone changes wifi network
@Injectable()
export class WifiDaemon {
  private disconnectionMonitor: Subscription
  private connectionMonitor: Subscription

  constructor (
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly network: Network,
  ) { }

  async watch () {
    this.enableDisconnectionMonitor()
    this.enableConnectionMonitor()
    this.enableChangeMonitor()
  }

  async enableDisconnectionMonitor () {
    this.disconnectionMonitor = this.network.onDisconnect().subscribe(() => {
      console.log('network disconnected')
      this.zeroconfDaemon.stop()
    })
  }

  async enableChangeMonitor () {
    this.disconnectionMonitor = this.network.onChange().subscribe(() => {
      console.log('network changed')
      this.manageZeroconfDaemon()
    })
  }
  async enableConnectionMonitor () {
    this.connectionMonitor = this.network.onConnect().subscribe(() => {
      console.log('network connected')
      this.manageZeroconfDaemon()
    })
  }

  async stop () {
    this.connectionMonitor.unsubscribe()
    this.disconnectionMonitor.unsubscribe()
  }

  private async manageZeroconfDaemon () {
    let pollingForConnection = setInterval(() => {
      if (this.network.type && this.network.type !== 'none') {
        clearInterval(pollingForConnection)
        if (this.network.type === 'wifi') {
          console.log('wifi connection obtained')
          this.zeroconfDaemon.reset()
        } else {
          this.zeroconfDaemon.stop()
        }
      }
    }, 500)
  }
}