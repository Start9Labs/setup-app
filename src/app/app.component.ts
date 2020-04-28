import { Component } from '@angular/core'
import { Platform, ModalController } from '@ionic/angular'
import { ServerModel } from './models/server-model'
import { ServerDaemon } from './daemons/server-daemon'
import { ZeroconfDaemon } from './daemons/zeroconf-daemon'
import { WifiDaemon } from './daemons/wifi-daemon'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'
import { ServerAppModel } from './models/server-app-model'
import { AuthenticatePage } from './modals/authenticate/authenticate.page'
import { Plugins } from '@capacitor/core'
import { TorService } from './services/tor.service'

const { SplashScreen } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  private firstAuth = true

  constructor (
    private readonly platform: Platform,
    private readonly serverModel: ServerModel,
    private readonly appModel: ServerAppModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly serverDaemon: ServerDaemon,
    private readonly wifiDaemon: WifiDaemon,
    private readonly authService: AuthService,
    private readonly torService: TorService,
    private readonly router: Router,
    private readonly modalCtrl: ModalController,
  ) {
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    this.platform.ready().then(async () => {
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
      // dismiss splash screen
      SplashScreen.hide()
    })
  }

  private async handleAuthChange (authStatus: AuthStatus) {
    // verified (mnemonic is present and unencrypted)
    if (authStatus === AuthStatus.VERIFIED) {
      if (this.firstAuth) {
        this.torService.init()
        await this.serverModel.load(this.authService.mnemonic!)
        this.firstAuth = false
        await this.router.navigate(['/auth'])
        this.startDaemons()
      } else {
        this.startDaemons(true)
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

  private startDaemons (restart = false) {
    this.zeroconfDaemon.start(restart)
    this.wifiDaemon.start()
    setTimeout(() => this.serverDaemon.start(), this.zeroconfDaemon.timeToPurge + 1000)
  }

  private stopDaemons () {
    this.serverDaemon.stop()
    this.wifiDaemon.stop()
    this.zeroconfDaemon.stop()
  }

  private clearModels () {
    this.serverModel.clear()
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
