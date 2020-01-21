import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server } from '../models/server-model'
import { ServerService } from './server.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { AppModel, AppHealthStatus } from '../models/app-model'
import { doForAtLeast, tryAll, pauseFor } from '../util/misc.util'

@Injectable({
  providedIn: 'root',
})
export class SyncNotifier {
  constructor (
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController,
    private readonly serverModel: ServerModel,
  ) { }

  async handleNotifications (server: Readonly<S9Server>): Promise<void> {
    const count = server.notifications.length

    if (!count) { return }
    let updates = { } as Partial<S9Server>

    updates.badge = server.badge + count
    updates.notifications = []

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
    this.serverModel.cacheServer(server, updates)
  }
}

@Injectable({
  providedIn: 'root',
})
export class ServerSyncService {
  private cached: ServerSync

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly appModel: AppModel,
    private readonly syncNotifier: SyncNotifier,
  ) { }

  refreshCache (): ServerSync {
    this.cached = this.fresh()
    return this.cached
  }

  fromCache (): ServerSync {
    return this.cached || this.refreshCache()
  }

  fresh (): ServerSync {
    return new ServerSync(
      this.serverService,
      this.serverModel,
      this.zeroconfDaemon,
      this.appModel,
      this.syncNotifier,
      new Date(),
    )
  }
}

export class ServerSync {
  syncing: boolean
  secondsDisconnectedBeforeUnreachable = 7

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly appModel: AppModel,
    private readonly syncNotifier: SyncNotifier,
    readonly initialized_at:  Date,
  ) { }

  async syncServers (): Promise<void> {
    if (this.syncing) { return }

    this.syncing = true
    console.log('syncing servers: ', this.serverModel.serverMap)
    await doForAtLeast(1000, this.serverModel.servers.map(server => this.syncServer(server)))
    this.syncing = false
  }

  async syncServer (server: Readonly<S9Server>, retryIn?: number): Promise<void> {
    if (server.updating && retryIn) { return this.retry(server, retryIn) }
    if (server.updating) { console.log(`Server ${server.id} already updating.`); return }

    this.serverModel.cacheServer(server, { updating: true })

    if (!this.zeroconfDaemon.getService(server.id) && this.hasBeenRunningSufficientlyLong(server)) {
      this.markServerUnreachable(server)
    } else if (!this.zeroconfDaemon.getService(server.id)) {
      return
    } else {
      await this.syncServerAttributes(server)
    }
    const updatedServer = this.serverModel.cacheServer(server, { updating: false })

    await this.serverModel.saveAll()
    this.syncNotifier.handleNotifications(updatedServer)
  }

  async syncServerAttributes (server: S9Server): Promise<void> {
    const [serverRes, appsRes] = await tryAll ( [
          this.serverService.getServer(server),
          pauseFor(250).then(() => this.serverService.getInstalledApps(server)),
        ],
    )

    switch (serverRes.result) {
      case 'resolve' : this.serverModel.cacheServer(server, serverRes.value); break
      case 'reject'  : {
        console.error(`get server request for ${server.id} rejected with ${JSON.stringify(serverRes.value)}`)
        this.markServerUnreachable(server)
        break
      }
    }

    switch (appsRes.result) {
      case 'resolve' : this.appModel.syncAppCache(server.id, appsRes.value); break
      case 'reject'  : {
        console.error(`get apps request for ${server.id} rejected with ${JSON.stringify(appsRes.value)}`)
        this.appModel.updateAppsUniformly(server.id, isUnreachable())
        break
      }
    }
  }

  private hasBeenRunningSufficientlyLong (server: S9Server): boolean {
    return (server.status === AppHealthStatus.UNKNOWN) &&
           (this.initialized_at.valueOf() + this.secondsDisconnectedBeforeUnreachable * 1000 < new Date().valueOf())

  }

  private markServerUnreachable (server: S9Server): void {
    this.serverModel.cacheServer(server, isUnreachable())
    this.appModel.updateAppsUniformly(server.id, isUnreachable())
  }

  private async retry (server: S9Server, retryIn: number): Promise<void> {
    console.log(`syncServer called while server updating. Will retry in ${retryIn / 1000} seconds`)
    await pauseFor(retryIn)
    console.log('ready to retry.')
    return this.syncServer(server, retryIn)
  }

}

const isUnreachable = () =>  ({ status: AppHealthStatus.UNREACHABLE, statusAt: new Date().toISOString() })
