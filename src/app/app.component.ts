import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { S9ServerModel } from './models/server-model'
import { HealthDaemon } from './daemons/health-daemon'
import { WifiDaemon } from './daemons/wifi-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'

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
    // set dark theme
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    platform.ready().then(async () => {
      // subscribe to change in auth events
      this.authService.authState.subscribe(isAuthed => {
        this.subscribeToAuth(isAuthed)
      })
      // init auth service to obtain initial status
      await this.authService.init()
      // load data if authenticated
      if (this.authService.mnemonic) {
        await this.dataService.load(this.authService.mnemonic)
      }
      // mock zeroconf daemon - watches for zeroconf services on LAN
      // this.zeroconfDaemon.mock()

      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // detects new LAN services
        this.zeroconfDaemon.watch()
        // detects wifi connection and resets zeroconf daemon if so
        this.wifiDaemon.watch()
        // iterates through servers in S9ServerModel and tries to status check w Tor and Lan every 5 seconds
        // consider adding an attempts counter per server
        this.healthDaemon.serverStatusCheck(5000)
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

  private async subscribeToAuth (isAuthed: boolean) {
    if (isAuthed) {
      this.router.navigate([''])
    } else {
      this.router.navigate(['welcome'])
    }
  }
}
