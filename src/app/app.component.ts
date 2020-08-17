import { Component } from '@angular/core'
import { NetworkMonitor } from './services/network.service'
import { ZeroconfMonitor } from './services/zeroconf.service'
import { AppState } from './app-state'
import { Router } from '@angular/router'

import { Plugins, StatusBarStyle } from '@capacitor/core'
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
    private readonly router: Router,
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
    // navigate
    if (this.appState.peekDevices().length) {
      this.router.navigate(['/'])
    } else {
      this.router.navigate(['/connect'], { queryParams: { isRoot: 1 } })
    }
    // set StatusBar style
    StatusBar.setStyle({
      style: StatusBarStyle.Dark,
    })
    // dismiss SplashScreen
    SplashScreen.hide()
  }
}