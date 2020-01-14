import { Injectable } from '@angular/core'
import { ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus, AppModel } from '../models/app-model'

@Injectable({
  providedIn: 'root',
})
export class SyncDaemon {
  private going: boolean
  private initialPass: boolean
  private static readonly ms = 10000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
  ) { }

  async start (): Promise<void> {
    if (this.going) { return }
    this.initialPass = true
    this.going = true

    while (this.going) {
      console.log('syncing servers: ', this.serverModel.servers)

      Promise.all(this.serverModel.servers.map(async server => {
        // return if already updating
        if (server.updating) { return }

        server.updating = true

        // server
        try {
          const serverRes = await this.serverService.getServer(server)
          Object.assign(server, serverRes)
          await this.serverModel.saveAll()
        } catch (e) {
          server.status = this.initialPass ? AppHealthStatus.UNKNOWN : AppHealthStatus.UNREACHABLE
          server.statusAt = new Date()
        }
        // apps
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

        server.updating = false
      }))

      this.initialPass = false

      await pauseFor(SyncDaemon.ms)
    }
  }

  stop () {
    this.going = false
  }
}
