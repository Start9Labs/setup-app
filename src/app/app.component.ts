import { Component } from '@angular/core'
import { Platform, ModalController } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { ServerModel } from './models/server-model'
import { ServerDaemon } from './daemons/server-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'
import { AppModel } from './models/app-model'
import { AuthenticatePage } from './modals/authenticate/authenticate.page'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  private firstAuth = true

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
    private readonly modalCtrl: ModalController,
  ) {
    console.log('app serverModel, ', JSON.stringify(this.serverModel.darkCache))
    console.log('app appModel, ', JSON.stringify(this.appModel.lightCache))
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    console.log('not ready')
    this.platform.ready().then(async () => {
      console.log('platform ready')
      // init auth service
      await this.authService.init()
      // subscribe to auth status changes
      this.authService.watch().subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // subscribe to app pause event
      this.platform.pause.subscribe(() => {
        this.authService.uninit()
        this.stopDaemons()
      })
      // sunscribe to app resume event
      this.platform.resume.subscribe(() => {
        this.authService.init()
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
        this.firstAuth = false
        await this.router.navigate(['/auth'])
      } else {
        this.restartDaemons()
      }
    // missing (no mnemonic)
    } else if (authStatus === AuthStatus.MISSING) {
      this.clearModels()
      this.stopDaemons()
      this.firstAuth = true
      await this.router.navigate(['/unauth'])
    // unverified (mnemonic is present but encrypted)
    } else if (authStatus === AuthStatus.UNVERIFIED) {
      await this.presentModalAuthenticate()
    }
  }

  private initDaemons () {
    this.zeroconfDaemon.start()
    this.serverDaemon.start()
  }

  private restartDaemons () {
    this.zeroconfDaemon.start()
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

  async presentModalAuthenticate () {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AuthenticatePage,
    })

    await modal.present()
  }
}
