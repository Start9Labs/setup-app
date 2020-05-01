import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server, ServerStatus } from '../models/server-model'
import { ApiService } from './api.service'
import { AppStatus } from '../models/app-model'
import { tryAll, pauseFor } from '../util/misc.util'
import { ServerAppModel } from '../models/server-app-model'
import { TorService, TorConnection } from './tor.service'
import { ZeroconfMonitor } from './zeroconf.service'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import * as uuid from 'uuid'

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
            return true
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
    this.serverModel.updateServer(server.id, updates)
  }
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  embassies: { [id: string]: EmbassyDaemon } = { }

  constructor (
    private readonly apiService: ApiService,
    private readonly serverModel: ServerModel,
    private readonly serverAppModel: ServerAppModel,
    private readonly syncNotifier: SyncNotifier,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly torService: TorService,
  ) { }

  init (): void {
    this.zeroconfMonitor.watchServiceFound().subscribe(s => this.handleZeroconfService(s))
    this.torService.watchConnection().subscribe(c => this.handleTorChange(c))
  }

  async sync (id: string): Promise<void> {
    let server = this.serverModel.peek(id)

    if (!server) { return }

    if (!this.embassies[id]) {
      this.embassies[id] = new EmbassyDaemon(
        id,
        this.apiService,
        this.serverModel,
        this.serverAppModel,
        this.syncNotifier,
      )
    }

    this.embassies[id].start()
  }

  async syncAll (): Promise<void> {
    const servers = this.serverModel.peekAll()
    servers.forEach(s => this.sync(s.id))
  }

  private handleZeroconfService (service: ZeroconfService) {
    this.sync(service.name.split('-')[1])
  }

  private handleTorChange (connection: TorConnection): void {
    if (connection === TorConnection.connected) {
      this.syncAll()
    }
  }
}

class EmbassyDaemon {
  private readonly syncInterval = 5000
  private forceStop = false
  private daemonId: string
  private server: S9Server

  constructor (
    private readonly id: string,
    private readonly apiService: ApiService,
    private readonly serverModel: ServerModel,
    private readonly serverAppModel: ServerAppModel,
    private readonly syncNotifier: SyncNotifier,
  ) { }

  async start (daemonId = uuid.v4(), recycled = false) {
    if (this.forceStop || recycled && daemonId !== this.daemonId) { return }
    this.daemonId = daemonId

    this.server = this.serverModel.peek(this.id)
    if (!this.server) { return }

    console.log(`syncing ${this.id}`)

    await this.getServerAndApps()

    this.server = this.serverModel.peek(this.id)
    if (!this.server) { return }

    this.syncNotifier.handleNotifications(this.server)

    setTimeout(() => this.start(daemonId, true), this.syncInterval)
  }

  stop (): void {
    this.forceStop = true
  }

  markServerUnreachable (): void {
    this.serverModel.updateServer(this.id, serverUnreachable())
    this.serverAppModel.get(this.id).updateAppsUniformly(appUnreachable())
  }

  private async getServerAndApps (): Promise<void> {
    const [serverRes, appsRes] = await tryAll([
      this.apiService.getServer(this.id),
      pauseFor(250).then(() => this.apiService.getInstalledApps(this.id)),
    ])

    switch (serverRes.result) {
      case 'resolve': {
        this.serverModel.updateServer(this.id, serverRes.value)
        break
      }
      case 'reject': {
        console.error(`get server request for ${this.id} rejected with ${JSON.stringify(serverRes.value)}`)
        this.markServerUnreachable()
        break
      }
    }

    switch (appsRes.result) {
      case 'resolve': {
        this.serverAppModel.get(this.id).syncAppCache(appsRes.value)
        break
      }
      case 'reject': {
        console.error(`get apps request for ${this.id} rejected with ${JSON.stringify(appsRes.value)}`)
        this.serverAppModel.get(this.id).updateAppsUniformly(appUnreachable())
        break
      }
    }
  }
}

const serverUnreachable = () =>  ({ status: ServerStatus.UNREACHABLE, statusAt: new Date().toISOString() })
const appUnreachable = () =>  ({ status: AppStatus.UNREACHABLE, statusAt: new Date().toISOString() })
