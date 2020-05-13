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
import { Router } from '@angular/router'
import { ServerAppModel } from './models/server-app-model'
import { Storage } from '@ionic/storage'

import { Plugins, StatusBarStyle } from '@capacitor/core'
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
    private readonly serverAppModel: ServerAppModel,
    private readonly authService: AuthService,
    private readonly networkMonitor: NetworkMonitor,
    private readonly torService: TorService,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly syncService: SyncService,
    private readonly modalCtrl: ModalController,
    private readonly router: Router,
    private readonly storage: Storage,
  ) {
    // set dark theme
    document.body.classList.toggle('dark', true)

    this.platform.ready().then(async () => {
      // storage ready
      await this.storage.ready()
      // start services
      await this.startServices()
      // initial loading and navigation based on auth
      if (this.authService.isVerified()) {
        await this.serverModel.load(this.authService.mnemonic!)
        this.router.navigate(['/auth'])
      } else {
        this.router.navigate(['/unauth'])
      }
      // subscribe to auth status changes
      this.authService.watch().subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // subscribe to app pause event
      this.platform.pause.subscribe(() => {
        this.stopServices()
      })
      // sunscribe to app resume event
      this.platform.resume.subscribe(() => {
        this.startServices()
      })
      // set StatusBar style
      StatusBar.setStyle({
        style: StatusBarStyle.Dark,
      })
      // dismiss SplashScreen
      SplashScreen.hide()
    })
  }

  private async startServices (): Promise<void> {
    await this.networkMonitor.init()
    await this.authService.init()
    this.serverModel.init()
    this.serverAppModel.init()
    this.torService.init()
    this.syncService.init()
    this.zeroconfMonitor.init()
  }

  private stopServices (): void {
    this.torService.stop()
    this.authService.uninit()
    this.networkMonitor.unint()
  }

  private async handleAuthChange (authStatus: AuthStatus): Promise<void> {
    if (authStatus === AuthStatus.UNVERIFIED) {
      await this.presentModalAuthenticate()
    }
  }

  private async presentModalAuthenticate (): Promise<void> {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: AuthenticatePage,
    })
    await modal.present()
  }
}
