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
  private paused = false
  private static readonly ms = 4000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: S9ServerModel,
  ) { }

  async start (): Promise<void> {
    if (this.going) { return }

    this.going = true

    while (this.going) {
      if (this.paused) { break }
      console.log('syncing servers: ', this.serverModel.servers)

      Promise.all(this.serverModel.servers.map(async server => {
        // return if already updating
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

        serverClone.updating = false

        await this.serverModel.updateServer(serverClone)
      }))

      this.paused = true
      await pauseFor(SyncDaemon.ms)
      this.paused = false
    }
  }

  stop () {
    this.going = false
  }
}
