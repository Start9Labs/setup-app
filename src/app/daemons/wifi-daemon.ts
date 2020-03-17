import { Injectable } from '@angular/core'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { Plugins, PluginListenerHandle, NetworkStatus } from '@capacitor/core'

const { Network } = Plugins

// detects when phone changes wifi network
@Injectable({
  providedIn: 'root',
})
export class WifiDaemon {
  private changeMonitor: PluginListenerHandle | undefined

  constructor (
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  start () {
    console.log('starting wifi daemon')
    if (!this.changeMonitor) {
      this.changeMonitor = Network.addListener('networkStatusChange', (status) => this.handleNetworkChange(status))
    }
  }

  handleNetworkChange (status: NetworkStatus) {
    const { connected, connectionType } = status
    console.log('Network Status', status)

    if (connected && connectionType === 'wifi') {
      console.log('connected to wifi')
      this.zeroconfDaemon.reset()
    } else {
      console.log('wifi disconnected')
      this.zeroconfDaemon.clearAndStop()
    }
  }

  stop () {
    console.log('stopping wifi daemon')
    if (this.changeMonitor) {
      this.changeMonitor.remove()
      this.changeMonitor = undefined
    }
  }
}