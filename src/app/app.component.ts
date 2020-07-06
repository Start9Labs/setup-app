import { Component } from '@angular/core'
import { ZeroconfMonitor } from './services/zeroconf.service'

import { Plugins, StatusBarStyle } from '@capacitor/core'
const { SplashScreen, StatusBar } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly zeroconfMonitor: ZeroconfMonitor,
  ) {
    // set dark theme
    document.body.classList.toggle('dark', true)
    // start zeroconf monitor
    this.zeroconfMonitor.init()
    // set StatusBar style
    StatusBar.setStyle({
      style: StatusBarStyle.Dark,
    })
    // dismiss SplashScreen
    SplashScreen.hide()
  }
}
