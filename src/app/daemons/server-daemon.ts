import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/app-model'
import { Storage } from '@ionic/storage'

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
  ) { }

  async init () {
    this.initialized_at = new Date().valueOf()
    this.syncInterval = await this.storage.get('syncInterval')
    if (this.syncInterval === null) {
      return this.updateSyncInterval(10000)
    }
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

  async syncServers (): Promise<void> {
    if (this.syncing) { return }

    console.log('syncing servers: ', this.serverModel.servers)

    this.syncing = true

    await Promise.all(this.serverModel.servers.map(async server => {
      await this.syncServer(server)
    }))

    this.syncing = false
  }

  async syncServer (server: S9Server): Promise<void> {
    if (server.updating) { return }
    server.updating = true

    if (!server.zeroconf) {
      if (server.status === AppHealthStatus.UNKNOWN) {
        const now = new Date()
        if (this.initialized_at + 7000 < now.valueOf()) {
          server.status = AppHealthStatus.UNREACHABLE
          server.statusAt = now
        }
      }
      await pauseFor(1000)
      server.updating = false
    } else {
      try {
        const serverRes = await this.serverService.getServer(server)
        Object.assign(server, serverRes)
        this.handleNotifications(server)
        await this.serverModel.saveAll()
      } catch (e) {
        server.status = AppHealthStatus.UNREACHABLE
        server.statusAt = new Date()
      }

      server.updating = false
    }
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

  async handleNotifications (server: S9Server): Promise<void> {
    const count = server.notifications.length

    if (!count) { return }

    server.badge = server.badge + count
    server.notifications = []

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
