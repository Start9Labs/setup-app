import { Injectable } from '@angular/core'
import { HandshakeDaemon } from './handshake-daemon'
import { Network } from '@ionic-native/network/ngx'
import { Subscription } from 'rxjs'

// detects when phone changes wifi network
@Injectable()
export class WifiConnectionDaemon {
  private disconnectionMonitor: Subscription
  private connectionMonitor: Subscription

  constructor (
    private readonly hsDaemon: HandshakeDaemon,
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
      this.hsDaemon.stop()
    })
  }

  async enableChangeMonitor () {
    this.disconnectionMonitor = this.network.onChange().subscribe(() => {
      console.log('network changed')
      this.manageHandshakeDaemon()
    })
  }
  async enableConnectionMonitor () {
    this.connectionMonitor = this.network.onConnect().subscribe(() => {
      console.log('network connected')
      this.manageHandshakeDaemon()
    })
  }

  async stop () {
    this.connectionMonitor.unsubscribe()
    this.disconnectionMonitor.unsubscribe()
  }

  private async manageHandshakeDaemon () {
    let pollingForConnection = setInterval(() => {
      if (this.network.type && this.network.type !== 'none') {
        clearInterval(pollingForConnection)
        if (this.network.type === 'wifi') {
          console.log('wifi connection obtained')
          this.hsDaemon.reset()
        } else {
          this.hsDaemon.stop()
        }
      }
    }, 500)
  }
}