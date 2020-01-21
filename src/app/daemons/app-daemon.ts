import { S9Server } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus, AppModel } from '../models/app-model'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class AppDaemon {
  // daemon is currently polling
  private polling: boolean = false
  // daemon was currently suspended from polling and is ready to repoll
  private syncInterval: number = 5000

  // daemon is presently syncinc apps
  syncing: boolean = false

  server: S9Server | undefined
  pollingBeganAt: Date

  constructor (
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
  ) { }

  getServer (): S9Server | undefined {
    return this.server
  }

  async setAndGo (s9: S9Server): Promise<void> {
    this.server = s9
    this.start()
  }

  async start () {
    if (this.server && !this.polling) this.poll()
  }

  private async poll () : Promise<void> {
    this.polling = true
    this.pollingBeganAt = new Date()
    while (this.polling) {
      this.syncApps()
      await pauseFor(this.syncInterval)
    }
  }

  async syncApps (): Promise<void> {
    if (this.syncing || !this.server) { return }

    console.log('syncing apps')

    this.syncing = true

    try {
      const apps = await this.serverService.getInstalledApps(this.server)
      this.appModel.syncAppCache(this.server.id, apps)
    } catch (e) {
      console.warn('App sync failure: ' + e)

      const now = new Date()
      if (this.pollingBeganAt.valueOf() + 7000 < now.valueOf()) {
        this.appModel.updateAppsUniformly(this.server.id,
          { status: AppHealthStatus.UNREACHABLE, statusAt: now.toISOString() },
        )
      } else {
        this.appModel.updateAppsUniformly(this.server.id,
          { status: AppHealthStatus.UNKNOWN, statusAt: now.toISOString() },
        )
      }


    }

    this.syncing = false
  }

  suspend () {
    this.polling = false
  }

  stop () {
    this.polling = false
    this.server = undefined
  }
}
