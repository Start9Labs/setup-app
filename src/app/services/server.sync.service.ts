import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server, ServerStatus } from '../models/server-model'
import { ServerService } from './server.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { AppModel, AppStatus } from '../models/app-model'
import { doForAtLeast, tryAll, pauseFor } from '../util/misc.util'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

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
    this.serverModel.updateCache(server.id, updates)
  }
}

@Injectable({
  providedIn: 'root',
})
export class ServerSyncService {
  private cached: ServerSync | undefined

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly appModel: AppModel,
    private readonly syncNotifier: SyncNotifier,
  ) {
    this.zeroconfDaemon.watch().subscribe(zeroconfService => this.handleZeroconfUpdate(zeroconfService) )
  }

  fromCache (): ServerSync {
    return this.cached || this.refreshCache()
  }

  clearCache () {
    if (this.cached) {
      this.cached.updatingCache = { }
      this.cached = undefined
    }
  }

  private refreshCache (): ServerSync {
    this.cached = this.fresh()
    return this.cached
  }

  private fresh (): ServerSync {
    return new ServerSync(
      this.serverService,
      this.serverModel,
      this.zeroconfDaemon,
      this.appModel,
      this.syncNotifier,
      new Date(),
    )
  }

  private async handleZeroconfUpdate (zeroconfService: ZeroconfService | null): Promise<void> {
    if (!zeroconfService) { return }
    try {
      const server = this.serverModel.peek(zeroconfService.name.split('-')[1])
      this.fromCache().syncServer(server, 250)
    } catch (e) {
      console.warn(e.message)
    }
  }
}

export class ServerSync {
  updatingCache: { [serverId: string]: boolean } = { }
  syncing: boolean
  timeBeforeUnreachable = 7000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly appModel: AppModel,
    private readonly syncNotifier: SyncNotifier,
    readonly initialized_at:  Date,
  ) { }

  clearCache () {
    this.updatingCache = { }
  }

  async syncServers (): Promise<void> {
    if (this.syncing) { return }

    console.log('syncing servers')

    this.syncing = true
    await doForAtLeast(1000, this.serverModel.peekAll().map(server => this.syncServer(server)))
    this.syncing = false
  }

  async syncServer (server: Readonly<S9Server>, retryIn?: number): Promise<void> {
    const serverUpdating = this.updatingCache[server.id]

    if (serverUpdating && retryIn) {
      return this.retry(server, retryIn)
    }
    if (serverUpdating) {
      console.log(`Server ${server.id} already updating.`)
      return
    }

    this.updatingCache[server.id] = true

    if (!this.zeroconfDaemon.getService(server.id)) {
      if (this.hasBeenRunningSufficientlyLong(server)) {
        this.markServerUnreachable(server)
      }
    } else {
      await this.syncServerAttributes(server)
    }

    this.updatingCache[server.id] = false

    const updatedServer = this.serverModel.peek(server.id)

    await this.serverModel.saveAll()

    this.syncNotifier.handleNotifications(updatedServer)
  }

  async syncServerAttributes (server: S9Server): Promise<void> {
    const [serverRes, appsRes] = await tryAll([
      this.serverService.getServer(server.id),
      pauseFor(250).then(() => this.serverService.getInstalledApps(server.id)),
    ])

    switch (serverRes.result) {
      case 'resolve' : this.serverModel.updateCache(server.id, serverRes.value); break
      case 'reject'  : {
        console.error(`get server request for ${server.id} rejected with ${JSON.stringify(serverRes.value)}`)
        this.markServerUnreachable(server)
        break
      }
    }

    switch (appsRes.result) {
      case 'resolve' : {

        this.appModel.syncAppCache(server.id, appsRes.value)
        break
      }
      case 'reject'  : {
        console.error(`get apps request for ${server.id} rejected with ${JSON.stringify(appsRes.value)}`)
        this.appModel.updateAppsUniformly(server.id, appUnreachable())
        break
      }
    }
  }

  private hasBeenRunningSufficientlyLong (server: S9Server): boolean {
    return this.initialized_at.valueOf() + this.timeBeforeUnreachable < new Date().valueOf()

  }

  private markServerUnreachable (server: S9Server): void {
    this.serverModel.updateCache(server.id, serverUnreachable())
    this.appModel.updateAppsUniformly(server.id, appUnreachable())
  }

  private async retry (server: S9Server, retryIn: number): Promise<void> {
    console.log(`syncServer called while server updating. Retrying in ${retryIn} milliseconds`)
    await pauseFor(retryIn)
    return this.syncServer(server, retryIn)
  }
}

const serverUnreachable = () =>  ({ status: ServerStatus.UNREACHABLE, statusAt: new Date().toISOString() })
const appUnreachable = () =>  ({ status: AppStatus.UNREACHABLE, statusAt: new Date().toISOString() })
