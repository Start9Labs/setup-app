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
          pubkey: 'publickey',
          zeroconfHostname: 'start9-abcdef.local',
          friendlyName: 'My friendly server',
          torAddress: 'tor.onion.onion',
          handshakeWith: Connexion.NONE,
        })
      }

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // detects new lan services
        this.zcDaemon.watch()
        this.wcDaemon.watch()

        this.ssDaemon.handshakeLoop(5000)
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
