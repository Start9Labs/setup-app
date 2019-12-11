import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { S9ServerModel } from './models/server-model'
import { SyncDaemon } from './daemons/sync-daemon'
import { WifiDaemon } from './daemons/wifi-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'

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
    public s9ServerModel: S9ServerModel,
    public zeroconfDaemon: ZeroconfDaemon,
    public wifiDaemon: WifiDaemon,
    public syncDaemon: SyncDaemon,
    public authService: AuthService,
    public router: Router,
  ) {
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    platform.ready().then(async () => {
      // init auth service to obtain initial status
      await this.authService.init()
      // load data if authenticated
      if (this.authService.isAuthenticated()) {
        // isAuthenticated() => true means mnemonic is present, hence the bang.
        await this.s9ServerModel.load(this.authService.mnemonic!)
      }
      // subscribe to auth status
      this.authService.authState.subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // do Cordova things if Cordova
      if (platform.is('cordova')) {
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

  private async handleAuthChange (authStatus: AuthStatus) {
    if (authStatus === AuthStatus.authed) {
      this.startDaemons()
      this.router.navigate([''])
    } else if (authStatus === AuthStatus.unauthed) {
      this.s9ServerModel.servers = []
      this.stopDaemons()
      this.router.navigate(['welcome'])
    } else {
      return
    }
  }

  private startDaemons () {
    // syncs servers in S9ServerModel
    this.syncDaemon.start()
    // detects new LAN services
    // @TODO remove
    // this.zeroconfDaemon.mock()
    this.zeroconfDaemon.start()
    // monitors wifi connectivity
    this.wifiDaemon.start()
  }

  private stopDaemons () {
    this.syncDaemon.stop()
    this.zeroconfDaemon.stop()
    this.wifiDaemon.stop()
  }
}
