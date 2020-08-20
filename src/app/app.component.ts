import { Component } from '@angular/core'
import { NetworkMonitor } from './services/network.service'
import { AppState } from './app-state'
import { Plugins, StatusBarStyle } from '@capacitor/core'
import { ZeroconfMonitor } from './services/zeroconf/zeroconf.service'

const { SplashScreen, StatusBar } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly networkMonitor: NetworkMonitor,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly appState: AppState,
  ) {
    // set dark theme
    document.body.classList.toggle('dark', true)
    // init app
    this.init()
  }

  async init (): Promise<void> {
    // load storage
    await this.appState.load()
    // start network monitor
    await this.networkMonitor.init()
    // start zeroconf
    this.zeroconfMonitor.init()
    // set StatusBar style
    StatusBar.setStyle({
      style: StatusBarStyle.Dark,
    })
    // dismiss SplashScreen
    SplashScreen.hide()
  }
}