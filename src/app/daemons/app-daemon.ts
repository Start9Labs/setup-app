import { S9Server } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus, AppModel } from '../models/app-model'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class AppDaemon {
  private going: boolean
  private syncInterval: number = 5000
  syncing: boolean = false
  server: S9Server

  constructor (
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
  ) { }

  getServer (): S9Server {
    return this.server
  }

  setAndGo (s9: S9Server): void {
    this.server = s9
    this.start()
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
    if (this.syncing) { return }

    console.log('syncing apps')

    this.syncing = true

    try {
      const apps = await this.serverService.getInstalledApps(this.server)
      this.appModel.syncAppCache(this.server.id, apps)
    } catch (e) {
      console.error('App sync failure: ' + e)
      this.appModel.updateAppsUniformly(this.server.id,
        { status: AppHealthStatus.UNREACHABLE, statusAt: new Date().toISOString() },
      )
    }

    this.syncing = false
  }

  stop () {
    this.going = false
  }
}
