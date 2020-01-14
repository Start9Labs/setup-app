import { Component } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { ServerModel } from './models/server-model'
import { SyncDaemon } from './daemons/sync-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'
import { AppModel } from './models/app-model'
import { pauseFor } from './util/misc.util'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly platform: Platform,
    private readonly splashScreen: SplashScreen,
    private readonly statusBar: StatusBar,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly syncDaemon: SyncDaemon,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    this.platform.ready().then(async () => {
      // init auth service to obtain initial status
      await this.authService.init()
      // load data if authenticated
      if (this.authService.isAuthenticated()) {
        // isAuthenticated() => true means mnemonic is present, hence the bang.
        await this.serverModel.load(this.authService.mnemonic!)
      }
      // subscribe to auth status
      this.authService.authState.subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // init daemons
      this.initDaemons()
      // do Cordova things if Cordova
      if (platform.is('cordova')) {
        // style status bar for iOS and Android
        if (platform.is('ios')) {
          this.statusBar.styleDefault()
        } else {
          this.statusBar.styleLightContent()
        }
        setTimeout(() => {
          this.splashScreen.hide()
        }, 300)
      }
    })
  }

  private async initDaemons () {
    this.serverModel.init()
    this.appModel.init()
    this.syncDaemon.init()
    this.zeroconfDaemon.init()
  }

  private async handleAuthChange (authStatus: AuthStatus) {
    if (authStatus === AuthStatus.authed) {
      await this.router.navigate(['/'])
    } else if (authStatus === AuthStatus.unauthed) {
      await this.router.navigate(['/welcome'])
    } else {
      return
    }
  }
}
