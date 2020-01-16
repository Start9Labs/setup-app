import { Injectable } from '@angular/core'
import { Platform, ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server, S9Notification } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus, AppModel } from '../models/app-model'
import { AuthService } from '../services/auth.service'
import { Subscription } from 'rxjs'
import { Storage } from '@ionic/storage'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class SyncDaemon {
  private going: boolean
  private initialPass: boolean
  private pauseSub: Subscription | undefined
  private resumeSub: Subscription | undefined
  syncing: boolean
  syncInterval: number

  constructor (
    private readonly platform: Platform,
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly authService: AuthService,
    private readonly storage: Storage,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController,
  ) { }

  async init () {
    this.authService.authState.subscribe(async authStatus => {
      if (authStatus === AuthStatus.VERIFIED) {
        if (!this.pauseSub) {
          this.pauseSub = this.platform.pause.subscribe(() => {
            this.stop()
          })
        }
        if (!this.resumeSub) {
          this.resumeSub = this.platform.resume.subscribe(() => {
            this.start()
          })
        }
        this.syncInterval = await this.storage.get('syncInterval')
        if (this.syncInterval === null) {
          await this.updateSyncInterval(10000)
        }
        this.start()
      } else {
        if (this.pauseSub) {
          this.pauseSub.unsubscribe()
          this.pauseSub = undefined
        }
        if (this.resumeSub) {
          this.resumeSub.unsubscribe()
          this.resumeSub = undefined
        }
        this.stop()
      }
    })
  }

  async start (): Promise<void> {
    if (this.going || !this.syncInterval) { return }
    this.initialPass = true
    this.going = true

    while (this.going && this.syncInterval) {
      this.syncServers()

      await pauseFor(this.syncInterval)

      this.initialPass = false
    }
  }

  stop () {
    this.going = false
  }

  async syncServers (): Promise<void> {
    // return if already syncing
    if (this.syncing) { return }

    console.log('syncing servers: ', this.serverModel.servers)

    this.syncing = true

    await Promise.all(this.serverModel.servers.map(async server => {
      await Promise.all([
        this.syncServer(server),
        server.viewing ? this.syncApps(server) : Promise.resolve(),
      ])
    }))

    this.syncing = false
  }

  async syncServer (server: S9Server): Promise<void> {
    server.updating = true

    try {
      const serverRes = await this.serverService.getServer(server)
      Object.assign(server, serverRes)
      this.handleNotifications(server)
      await this.serverModel.saveAll()
    } catch (e) {
      server.status = this.initialPass ? AppHealthStatus.UNKNOWN : AppHealthStatus.UNREACHABLE
      server.statusAt = new Date()
    }

    server.updating = false
  }

  async syncApps (server: S9Server): Promise<void> {
    try {
      const apps = await this.serverService.getInstalledApps(server)
      // clear cache of removed apps
      this.appModel.getApps(server.id).forEach((app, index) => {
        if (!apps.find(a => a.id === app.id)) {
          this.appModel.getApps(server.id).splice(index, 1)
        }
      })
      // update cache with new app data
      apps.forEach(app => {
        this.appModel.cacheApp(server.id, app)
      })
    } catch (e) {
      this.appModel.getApps(server.id).forEach(app => {
        app.status = AppHealthStatus.UNREACHABLE
        app.statusAt = new Date()
      })
    }
  }

  async updateSyncInterval (ms: number) {
    this.syncInterval = ms
    await this.storage.set('syncInterval', this.syncInterval)
    if (!this.going) { this.start() }
  }

  async handleNotifications (server: S9Server): Promise<void> {
    const count = server.notifications.length

    if (!count) { return }

    const toast = await this.toastCtrl.create({
      header: server.label,
      message: `${count} new notification${count === 1 ? '' : 's'}`,
      position: 'bottom',
      duration: 4000,
      cssClass: 'notification-toast',
      buttons: [
        {
          side: 'start',
          icon: 'close',
          handler: () => {
            true
          },
        },
        {
          side: 'end',
          text: 'View',
          handler: () => {
            this.navCtrl.navigateForward(['/auth', 'servers', server.id, 'notifications'])
          },
        },
      ],
    })
    await toast.present()
  }
}
