import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { S9ServerModel } from './models/server-model'
import { HealthDaemon } from './daemons/health-daemon'
import { WifiDaemon } from './daemons/wifi-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { initHandshakeStatus } from './models/s9-server'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { initAppStatus } from './models/s9-app'

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
    public zeroconfDaemon: ZeroconfDaemon,
    public wifiDaemon: WifiDaemon,
    public healthDaemon: HealthDaemon,
    public authService: AuthService,
    public router: Router,
  ) {
    document.body.classList.toggle('dark', true)
    platform.ready().then(async () => {
      // load data into memory
      await this.dataService.load()

      // mocky mock
      if (!this.dataService.getServerCount()) {
        await this.dataService.saveServer({
          id: 'abcdefgh',
          friendlyName: `Matt's Server`,
          torAddress: 'agent-tor-address.onion',
          lastHandshake: initHandshakeStatus(),
          registered: false,
          apps: [
            {
              id: 'bitcoin',
              displayName: 'Bitcoin',
              torAddress: 'bitcoin-tor-address.onion',
              lastStatus: initAppStatus(),
            },
          ],
          zeroconfService: {
            domain: 'local.',
            type: '_http._tcp',
            name: 'start9-fb398cc6',
            hostname: '',
            ipv4Addresses: ['192.168.20.1'],
            ipv6Addresses: ['end9823u0ej2fb'],
            port: 5959,
            txtRecord: { },
          },
        })
      }

      this.zeroconfDaemon.mock()

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // detects new lan services
        this.zeroconfDaemon.watch()
        // detects wifi connection and resets zc daemon if so
        this.wifiDaemon.watch()
        // iterates through servers in S9ServerModel and tries to handshake w Tor and Lan every 5 seconds
        // consider adding an attempts counter per server
        this.healthDaemon.handshakeLoop(5000)
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
      this.authService.authState.subscribe(isAuthed => {
        if (isAuthed) {
          this.router.navigate([''])
        } else {
          this.router.navigate(['welcome'])
        }
      })
    })
  }
}
