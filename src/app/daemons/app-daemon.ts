import { Injectable } from '@angular/core'
import { ToastController, NavController } from '@ionic/angular'
import { ServerModel, S9Server } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus, AppModel } from '../models/app-model'
import { Storage } from '@ionic/storage'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'

export class AppDaemon {
  private going: boolean
  syncing: boolean
  private syncInterval: number = 5000

  constructor (
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
    private readonly server: S9Server,
  ) { }

  getServerId (): string {
    return this.server.id
  }

  async init () { this.start() }

  async start (): Promise<void> {
    if (this.going) { return }
    this.going = true

    while (this.going) {
      this.syncApps()
      await pauseFor(this.syncInterval)
    }
  }

  async syncApps (): Promise<void> {
    try {
      const apps = await this.serverService.getInstalledApps(this.server)
      this.appModel.syncAppCache(this.server.id, apps)
    } catch (e) {
      this.appModel.updateAppsUniformly(this.server.id,
        { status: AppHealthStatus.UNREACHABLE, statusAt: new Date() },
      )
    }
  }

  stop () {
    this.going = false
  }
}
