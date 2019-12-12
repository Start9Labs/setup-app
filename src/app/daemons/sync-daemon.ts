import { Injectable } from '@angular/core'
import { S9ServerModel, clone } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/s9-app'

@Injectable({
  providedIn: 'root',
})
export class SyncDaemon {
  private going = false
  private static readonly ms = 10000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: S9ServerModel,
  ) { }

  async start (): Promise<void> {
    this.going = true

    while (this.going) {
      console.log('syncing servers: ', this.serverModel.servers)

      Promise.all(this.serverModel.servers.map(async server => {
        if (server.updating) { return }

        let serverClone = clone({ ...server, updating: true })

        // save "updating: true" on the cached version of the server
        this.serverModel.reCacheServer(serverClone)

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

        } catch (e) {
          // @TODO create function for resetting s9Server to initial state
          serverClone = {
            ...serverClone,
            status: AppHealthStatus.UNREACHABLE,
            statusAt: new Date(),
            apps: [],
            specs: { },
          }
        }

        await pauseFor(3000)

        serverClone.updating = false

        await this.serverModel.saveServer(serverClone)
      }))

      await pauseFor(SyncDaemon.ms)
    }
  }

  stop () {
    this.going = false
  }
}