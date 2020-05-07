import { Component } from '@angular/core'
import { Platform, ModalController } from '@ionic/angular'
import { ServerModel } from './models/server-model'
import { NetworkMonitor } from './services/network.service'
import { AuthService } from './services/auth.service'
import { AuthStatus } from './types/enums'
import { AuthenticatePage } from './modals/authenticate/authenticate.page'
import { TorService } from './services/tor.service'
import { ZeroconfMonitor } from './services/zeroconf.service'
import { SyncService } from './services/sync.service'
import { Storage } from '@ionic/storage'

import { Plugins, StatusBarStyle } from '@capacitor/core'
import { Router } from '@angular/router'
const { SplashScreen, StatusBar } = Plugins

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor (
    private readonly platform: Platform,
    private readonly serverModel: ServerModel,
    private readonly authService: AuthService,
    private readonly networkMonitor: NetworkMonitor,
    private readonly torService: TorService,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly syncService: SyncService,
    private readonly modalCtrl: ModalController,
    private readonly router: Router,
    private readonly storage: Storage,
  ) {
    // set dark theme.
    document.body.classList.toggle('dark', true)
    // wait for platform reday
    this.platform.ready().then(async () => {
      await this.storage.ready()
      // init NetworkMonitor
      await this.networkMonitor.init()
      // init AuthService
      await this.authService.init()
      // if verified, load data
      if (this.authService.isVerified()) {
        await this.serverModel.load(this.authService.mnemonic!)
      }
      // init SyncService
      this.syncService.init()
      // init TorService
      this.torService.init()
      // init ZeroconfMonitor
      this.zeroconfMonitor.init()
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
      // set StatusBar style
      StatusBar.setStyle({
        style: StatusBarStyle.Dark,
      })
      this.router.initialNavigation()
      // dismiss SplashScreen
      setTimeout(() => {
        SplashScreen.hide()
      }, 300)
    })
  }

  private async handleAuthChange (authStatus: AuthStatus) {
    if (authStatus === AuthStatus.UNVERIFIED) {
      await this.presentModalAuthenticate()
    }
  }

  private async presentModalAuthenticate () {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AuthenticatePage,
    })
    await modal.present()
  }
}
