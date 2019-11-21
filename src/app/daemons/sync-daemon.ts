import { Injectable } from '@angular/core'
import { S9ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/s9-app'

@Injectable({
  providedIn: 'root',
})
export class SyncDaemon {
  private static readonly ms = 10000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: S9ServerModel,
  ) { }

  async sync (): Promise<void> {
    while (true) {
      const servers = this.serverModel.getServers()
      // @TODO should we await this?
      Promise.all(
        servers.map(async server => {
          if (server.updating) return

          server.updating = true

          let version = server.version
          let status = AppHealthStatus.UNKNOWN
          let specs = server.specs

          try {
            const res = await this.serverService.getServer(server)
            version = res.version
            status = res.status
            specs = res.specs
          } catch (e) {
            status = AppHealthStatus.UNREACHABLE
          } finally {
            server.updating = false
          }
          this.serverModel.saveServer({
            ...server,
            version,
            status,
            statusAt: new Date(),
            specs,
          })
        }),
      )
      await pauseFor(SyncDaemon.ms)
    }

  }
}