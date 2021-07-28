import { Component } from '@angular/core'
import { NetworkMonitor } from './services/network.service'
import { ZeroconfMonitor } from './services/zeroconf/zeroconf.service'
import { isPlatform, NavController } from '@ionic/angular'
import { App, AppState } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly navCtrl: NavController,
    private readonly networkMonitor: NetworkMonitor,
    private readonly zeroconfMonitor: ZeroconfMonitor,
  ) {
    // set dark theme
    // document.body.classList.toggle('dark', true)
    if (isPlatform('capacitor')) {
      // init native app
      this.initNative()
    }
    // this.navCtrl.navigateRoot(['/connect'])
  }

  async initNative (): Promise<void> {
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
      style: Style.Dark,
    })
    // dismiss SplashScreen
    setTimeout(() => {
      SplashScreen.hide()
    }, 400)
  }

  async initMonitors (): Promise<void> {
    // start network monitor
    await this.networkMonitor.init()
    // start zeroconf
    this.zeroconfMonitor.init()
  }
}