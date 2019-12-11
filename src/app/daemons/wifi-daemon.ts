import { Injectable } from '@angular/core'
import { Network } from '@ionic-native/network/ngx'
import { Subscription } from 'rxjs'
import { ZeroconfDaemon } from './zeroconf-daemon'

// detects when phone changes wifi network
@Injectable({
  providedIn: 'root',
})
export class WifiDaemon {
  private connectionMonitor: Subscription
  private disconnectionMonitor: Subscription
  private changeMonitor: Subscription

  constructor (
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly network: Network,
  ) { }

  start () {
    this.enableDisconnectionMonitor()
    this.enableConnectionMonitor()
    this.enableChangeMonitor()
  }

  stop () {
    if (this.connectionMonitor) { this.connectionMonitor.unsubscribe() }
    if (this.connectionMonitor) { this.disconnectionMonitor.unsubscribe() }
    if (this.connectionMonitor) { this.changeMonitor.unsubscribe() }
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

  // @TODO test whether onChange method actually works. There are known issues. Android and iOS
  enableChangeMonitor () {
    this.changeMonitor = this.network.onChange().subscribe(() => {
      console.log('network changed')
      this.manageZeroconfDaemon()
    })
  }

  private manageZeroconfDaemon () {
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