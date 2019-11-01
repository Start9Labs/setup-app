import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { ServerModel } from './storage/server-model'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { LANService } from './services/lan-service'
import { HandshakeDaemon } from './services/handshake-daemon'
import { WifiConnectionDaemon } from './services/wifi-connection-daemon'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    public platform: Platform,
    public splashScreen: SplashScreen,
    public statusBar: StatusBar,
    public dataService: ServerModel,
    public hsDaemon: HandshakeDaemon,
    public wcDaemon: WifiConnectionDaemon,
  ) {
    document.body.classList.toggle('dark', true)
    platform.ready().then(async () => {
      // load data into memory
      await this.dataService.load()

      // mocky mock
      if (!this.dataService.getServerCount()) {
        await this.dataService.saveServer({
          secret: '1234abcd',
          ssid: 'start9-abcd',
          friendlyName: 'My First S9Server',
          zeroconfHostname: 'start9-abcd.local',
          torAddress: 'hgfjandkhasjdbfkljamxjkasbnc.onion',
          ipAddress: 'lalalalalala',
          connected: true,
        })
      }

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        this.hsDaemon.watch()
        // check wifi connection every 5 seconds
        this.wcDaemon.watch()

        // style status bar for iOS and Android
        if (platform.is('ios')) {
          statusBar.styleDefault()
        } else {
          statusBar.styleLightContent()
        }
        setTimeout(() => {
          this.splashScreen.hide()
        }, 300)
      }
    })
  }
}
