import { Component, NgZone } from '@angular/core'
import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { ServerModel } from './models/server-model'
import { ServerDaemon } from './daemons/server-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'
import { AppModel } from './models/app-model'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  private firstAuth = true
  private pauseSub: Subscription | undefined
  private resumeSub: Subscription | undefined

  constructor (
    private readonly platform: Platform,
    private readonly splashScreen: SplashScreen,
    private readonly statusBar: StatusBar,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly serverDaemon: ServerDaemon,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly zone: NgZone,
  ) {
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    this.platform.ready().then(async () => {
      // init auth service
      await this.authService.init()
      // subscribe to auth status changes
      this.authService.authState.subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
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

  private async handleAuthChange (authStatus: AuthStatus) {
    // verified (mnemonic is present and unencrypted)
    if (authStatus === AuthStatus.VERIFIED) {
      if (this.firstAuth) {
        await this.serverModel.load(this.authService.mnemonic!)
        this.initDaemons()
        this.pauseSub = this.platform.pause.subscribe(() => {
          this.authService.uninit()
          this.stopDaemons()
        })
        this.resumeSub = this.platform.resume.subscribe(() => {
          this.authService.init()
        })
        this.firstAuth = false
        await this.router.navigate(['/auth'])
      } else {
        this.restartDaemons()
      }
    // missing (no mnemonic)
    } else if (authStatus === AuthStatus.MISSING) {
      this.clearModels()
      this.firstAuth = true
      if (this.pauseSub) {
        this.pauseSub.unsubscribe()
        this.pauseSub = undefined
      }
      if (this.resumeSub) {
        this.resumeSub.unsubscribe()
        this.resumeSub = undefined
      }
      await this.router.navigate(['/unauth'])
    // unverified (mnemonic is present but encrypted)
    } else if (authStatus === AuthStatus.UNVERIFIED) {
      this.zone.run(async () => {
        await this.router.navigate(['/authenticate'])
      })
    }
  }

  private initDaemons () {
    this.zeroconfDaemon.init()
    this.serverDaemon.init()
  }

  private restartDaemons () {
    this.zeroconfDaemon.start(true)
    this.serverDaemon.start()
  }

  private stopDaemons () {
    this.serverDaemon.stop()
    this.zeroconfDaemon.stop()
  }

  private clearModels () {
    this.serverModel.clearCache()
    this.appModel.clearCache()
  }
}
