import { Component } from '@angular/core'
import { Platform, ModalController } from '@ionic/angular'
import { ServerModel } from './models/server-model'
import { NetworkService } from './services/network.service'
import { AuthService } from './services/auth.service'
import { Router } from '@angular/router'
import { AuthStatus } from './types/enums'
import { ServerAppModel } from './models/server-app-model'
import { AuthenticatePage } from './modals/authenticate/authenticate.page'
import { Plugins } from '@capacitor/core'
import { TorService } from './services/tor.service'
import { ZeroconfMonitor } from './services/zeroconf.service'
import { SyncService } from './services/sync.service'

const { SplashScreen } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly platform: Platform,
    private readonly serverModel: ServerModel,
    private readonly appModel: ServerAppModel,
    private readonly authService: AuthService,
    private readonly networkService: NetworkService,
    private readonly torService: TorService,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly syncService: SyncService,
    private readonly router: Router,
    private readonly modalCtrl: ModalController,
  ) {
    // set dark theme.
    // @TODO there should be a way to make this the default.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    this.platform.ready().then(async () => {
      // init AuthService
      await this.authService.init()
      if (this.authService.isVerified()) {
        await this.serverModel.load(this.authService.mnemonic!)
      }
      // init NetworkService
      this.networkService.init()
      // init TorService
      this.torService.init()
      // init ZeroconfMonitor
      this.zeroconfMonitor.init()
      // init SyncService
      this.syncService.init()
      // subscribe to auth status changes
      this.authService.watch().subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // subscribe to app pause event
      this.platform.pause.subscribe(() => {
        this.authService.uninit()
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
    // VERIFIED (mnemonic is present and unencrypted)
    if (authStatus === AuthStatus.VERIFIED) {
      await this.router.navigate(['/auth'])
    // MISSING (no mnemonic)
    } else if (authStatus === AuthStatus.MISSING) {
      this.clearModels()
      await this.router.navigate(['/unauth'])
    // UNVERIFIED (mnemonic is present but encrypted)
    } else if (authStatus === AuthStatus.UNVERIFIED) {
      await this.presentModalAuthenticate()
    }
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
