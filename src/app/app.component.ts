import { Component } from '@angular/core'
import { NetworkMonitor } from './services/network.service'
import { Store } from './store'
import { Plugins, StatusBarStyle, AppState } from '@capacitor/core'
import { ZeroconfMonitor } from './services/zeroconf/zeroconf.service'
import { KEY_GEN } from './util/crypto'
import * as forge from 'node-forge'

const { App, SplashScreen, StatusBar } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly networkMonitor: NetworkMonitor,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly store: Store,
  ) {
    // set dark theme
    document.body.classList.toggle('dark', true)
    // init app
    this.init()
  }

  async init (): Promise<void> {
    window['tor'] = KEY_GEN.tor
    window['rsa'] = KEY_GEN.rsa
    window['privkeyToPem'] = forge.pki.privateKeyToPem
    // load storage
    await this.store.load()
    // init monitors
    await this.initMonitors()
    // subscribe to app pause/resume event
    App.addListener('appStateChange', async (state: AppState) => {
      if (state.isActive) {
        await this.initMonitors()
      } else {
        this.networkMonitor.stop()
      }
    })
    // set StatusBar style
    StatusBar.setStyle({
      style: StatusBarStyle.Dark,
    })
    // dismiss SplashScreen
    SplashScreen.hide()
  }

  async initMonitors (): Promise<void> {
    // start network monitor
    await this.networkMonitor.init()
    // start zeroconf
    return this.zeroconfMonitor.init()
  }
}