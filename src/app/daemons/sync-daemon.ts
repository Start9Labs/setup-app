import { Injectable } from '@angular/core'
import { S9ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/s9-app'
import { toS9AgentApp } from '../models/s9-server'

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

      console.log('syncing servers: ', servers)

      Promise.all(servers.map(async server => {
        if (server.updating) { return }

        server.updating = true

        let serverClone = { ...server }
        try {
          const [serverRes, apps] = await Promise.all([
            this.serverService.getServer(server),
            this.serverService.getInstalledApps(server),
          ])

          serverClone = {
            ...serverClone,
            ...serverRes,
            apps,
          }

          serverClone.apps.unshift(toS9AgentApp(serverClone))

        } catch (e) {
          serverClone = {
            ...serverClone,
            status: AppHealthStatus.UNREACHABLE,
            statusAt: new Date(),
          }
        }

        serverClone.updating = false

        await this.serverModel.saveServer(serverClone)
      }))

      await pauseFor(SyncDaemon.ms)
    }
  }
}