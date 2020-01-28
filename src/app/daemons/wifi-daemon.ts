import { Injectable } from '@angular/core'
import { Network } from '@ionic-native/network/ngx'
import { Subscription, interval } from 'rxjs'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { debounce } from 'rxjs/operators'

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
    console.log('starting wifi daemon')
    if (!this.connectionMonitor) {
      this.connectionMonitor = this.network.onConnect().pipe(debounce(() => interval(1000))).subscribe(() => {
        console.log('network connected')
        this.manageZeroconfDaemon()
      })
    }
    if (!this.disconnectionMonitor) {
      this.disconnectionMonitor = this.network.onDisconnect().subscribe(() => {
        console.log('network disconnected, no internet')
        this.zeroconfDaemon.clearAndStop()
      })
    }
  }

  stop () {
    console.log('stopping wifi daemon')
    if (this.connectionMonitor) {
      this.connectionMonitor.unsubscribe()
      this.connectionMonitor = undefined
    }
    if (this.disconnectionMonitor) {
      this.disconnectionMonitor.unsubscribe()
      this.disconnectionMonitor = undefined
    }
  }

  private manageZeroconfDaemon () {
    let pollingForConnection = setInterval(() => {
      console.log('polling for network')
      if (this.network.type !== 'none') {
        clearInterval(pollingForConnection)
        if (this.network.type === 'wifi') {
          console.log('connected to wifi')
          this.zeroconfDaemon.reset()
        } else {
          console.log('disconnected from wifi')
          this.zeroconfDaemon.clearAndStop()
        }
      }
    }, 200)
  }
}