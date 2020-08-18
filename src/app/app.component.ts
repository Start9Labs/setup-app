import { Component } from '@angular/core'
import { NetworkMonitor } from './services/network.service'
import { AppState } from './app-state'
import { Router } from '@angular/router'
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
      await this.router.navigate(['/'])
    } else {
      await this.router.navigate(['/connect'])
    }
    // set StatusBar style
    await StatusBar.setStyle({
      style: StatusBarStyle.Dark,
    })
    // dismiss SplashScreen
    SplashScreen.hide()
  }
}