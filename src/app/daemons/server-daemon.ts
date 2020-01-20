import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/app-model'
import { Storage } from '@ionic/storage'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

@Injectable({
  providedIn: 'root',
})
export class ServerDaemon {
  private going: boolean
  private initialized_at: number
  syncing: boolean
  syncInterval: number

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly storage: Storage,
    private readonly toastCtrl: ToastController,
    private readonly navCtrl: NavController,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async init () {
    this.initialized_at = new Date().valueOf()
    this.syncInterval = await this.storage.get('syncInterval')
    if (this.syncInterval === null) { return this.updateSyncInterval(10000) }

    this.zeroconfDaemon.watch().subscribe(zeroconfService => this.handleZeroconfUpdate(zeroconfService) )

    this.start()
  }

  async start (): Promise<void> {
    if (this.going || !this.syncInterval) { return }
    this.going = true

    while (this.going && this.syncInterval) {
      this.syncServers()
      await pauseFor(this.syncInterval)
    }
  }

  stop () {
    this.going = false
  }

  async handleZeroconfUpdate (zeroconfService: ZeroconfService | null): Promise<void> {
    if (!zeroconfService) { return }
    const server = this.serverModel.getServer(zeroconfService.name.split('-')[1])
    if (server) {
      this.syncServer(server, 250)
    }
  }

  async syncServers (): Promise<void> {
    if (this.syncing) { return }

    console.log('syncing servers: ', this.serverModel.serverMap)

    this.syncing = true

    await Promise.all(
      this.serverModel.servers.map(server => this.syncServer(server)).concat(pauseFor(1000)),
    )

    this.syncing = false
  }

  async syncServer (server: Readonly<S9Server>, retryIn?: number): Promise<void> {
    if (server.updating) {
      if (retryIn) {
        await pauseFor(retryIn)
        return this.syncServer(server, retryIn)
      } else {
        return
      }
    }

    this.serverModel.cacheServer(server, { updating: true })

    let updates = { } as Partial<S9Server>
    if (!this.zeroconfDaemon.getService(server.id)) {
      if (server.status === AppHealthStatus.UNKNOWN) {
        const now = new Date()
        if (this.initialized_at + 7000 < now.valueOf()) {
          updates.status = AppHealthStatus.UNREACHABLE
          updates.statusAt = now
        }
      }
    } else {
      try {
        const serverRes = await this.serverService.getServer(server)
        Object.assign(updates, serverRes)
      } catch (e) {
        updates.status = AppHealthStatus.UNREACHABLE
        updates.statusAt = new Date()
      }
    }

    updates.updating = false
    const updatedServer = this.serverModel.cacheServer(server, updates)
    await this.serverModel.saveAll()
    this.handleNotifications(updatedServer)
  }

  async updateSyncInterval (ms: number) {
    this.syncInterval = ms
    if (this.syncInterval) {
      this.start()
      await this.storage.set('syncInterval', this.syncInterval)
    } else {
      this.going = false
      await this.storage.remove('syncInterval')
    }
  }

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
