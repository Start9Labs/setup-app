import { Component, NgZone, HostBinding } from '@angular/core'
import { Platform, ModalController } from '@ionic/angular'
import { ServerModel } from './models/server-model'
import { NetworkMonitor } from './services/network.service'
import { AuthService } from './services/auth.service'
import { AuthStatus } from './types/enums'
import { AuthenticatePage } from './modals/authenticate/authenticate.page'
import { TorService, TorConnection } from './services/tor.service'
import { Store } from './store'
import { ZeroconfMonitor } from './services/zeroconf.service'
import { SyncService } from './services/sync.service'
import { Router } from '@angular/router'
import { ServerAppModel } from './models/server-app-model'
import { Storage } from '@ionic/storage'
import { animate, style, transition, trigger } from '@angular/animations'

import { Plugins, StatusBarStyle } from '@capacitor/core'
const { SplashScreen, StatusBar } = Plugins

const torAnimation = trigger(
  'torChange',
  [
    transition(
      ':enter',
      [
        style({ transform: 'translateY(100%)' }),
        animate('.2s ease-in', style({ transform: 'translateY(0%)' })),
      ],
    ),
    transition(
      ':leave',
      [
        animate('.2s ease-out', style({ transform: 'translateY(100%)' })),
      ],
    ),
  ],
)

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  animations: [torAnimation],
})
export class AppComponent {
  private firstAuth = true
  progress: number
  @HostBinding('class.has-global-footer') globalFooterEnabled = false

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
    private readonly store: Store,
    private readonly zone: NgZone,
  ) {
    // set dark theme
    document.body.classList.toggle('dark', true)

    this.platform.ready().then(async () => {
      // storage ready
      await this.storage.ready()
      // init network and auth
      await this.initNetworkAndAuth()
      // initial loading and navigation based on auth
      if (this.authService.isVerified()) {
        await this.handleFirstAuth()
      } else if (this.authService.isMissing()) {
        await this.handleFirstUnauth()
      }
      // start monitors
      this.initMonitors()
      this.torService.watchConnection().subscribe(c => {
        this.zone.run(() => {
          if (c === TorConnection.in_progress) {
            this.globalFooterEnabled = true
          } else {
            this.globalFooterEnabled = false
          }
        })
      })

      this.torService.watchProgress().subscribe(p => {
        this.zone.run(() => {
          this.progress = p / 100
        })
      })
      // subscribe to auth status changes
      this.authService.watch().subscribe(authStatus => {
        this.handleAuthChange(authStatus)
      })
      // subscribe to app pause event
      this.platform.pause.subscribe(() => {
        this.stopServices()
      })
      // sunscribe to app resume event
      this.platform.resume.subscribe(async () => {
        await this.initNetworkAndAuth()
        this.initMonitors()
      })
      // set StatusBar style
      StatusBar.setStyle({
        style: StatusBarStyle.Dark,
      })
      // dismiss SplashScreen
      SplashScreen.hide()
    })
  }

  private async initNetworkAndAuth (): Promise<void> {
    await this.networkMonitor.init()
    await this.authService.init()
  }

  private initMonitors (): void {
    this.store.initMonitors()
    this.serverModel.initMonitors()
    this.serverAppModel.initMonitors()
    this.torService.initMonitors()
    this.syncService.initMonitors()
    this.zeroconfMonitor.initMonitors()
  }

  private stopServices (): void {
    this.torService.stop()
    this.authService.uninit()
    this.networkMonitor.unint()
  }

  private async handleFirstAuth (): Promise<void> {
    await this.serverModel.load(this.authService.mnemonic!)
    await this.store.load()
    this.router.navigate(['/auth'])
    this.firstAuth = false
  }

  private async handleFirstUnauth (): Promise<void> {
    this.router.navigate(['/unauth'])
    this.firstAuth = false
  }

  private async handleAuthChange (status: AuthStatus): Promise<void> {
    if (this.firstAuth) {
      if (status === AuthStatus.VERIFIED) {
        this.handleFirstAuth()
      } else if (status === AuthStatus.MISSING) {
        this.router.navigate(['/unauth'])
      }
    }
    if (status === AuthStatus.UNVERIFIED) {
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
