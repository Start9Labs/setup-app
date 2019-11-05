import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { S9ServerModel } from './storage/server-model'
import { ServerStatusDaemon } from './services/server-status-daemon'
import { WifiConnectionDaemon } from './services/wifi-connection-daemon'
import { ZeroconfDaemon } from './services/zeroconf-daemon'
import { S9Server, Connexion } from './storage/s9-server'

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
    public dataService: S9ServerModel,
    public zcDaemon: ZeroconfDaemon,
    public wcDaemon: WifiConnectionDaemon,
    public ssDaemon: ServerStatusDaemon,
  ) {
    document.body.classList.toggle('dark', true)
    platform.ready().then(async () => {
      // load data into memory
      await this.dataService.load()

      // mocky mock
      if (!this.dataService.getServerCount()) {
        await this.dataService.saveServer({
          id: 'abcdef',
          friendlyName: 'My friendly server',
          torAddress: 'tor.onion.onion',
          handshakeWith: Connexion.NONE,
        })
      }

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // detects new lan services
        this.zcDaemon.watch()

        // detects wifi connection and resets zc daemon if so
        this.wcDaemon.watch()

        // iterates through servers in S9ServerModel and tries to handshake w Tor and Lan every 5 seconds
        // consider adding an attempts counter per server
        this.ssDaemon.handshakeLoop(5000)

        // iterates through servers in S9ServerModel and detects which are missing Tor and Lan info and retrieves that data if possible
        // consider adding an attempts counter per server
        this.ssDaemon.setupLoop(5000)

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
