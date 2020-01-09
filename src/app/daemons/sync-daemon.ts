import { Injectable } from '@angular/core'
import { S9ServerModel } from '../models/server-model'
import { pauseFor, deepCloneObject } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/s9-app'

@Injectable({
  providedIn: 'root',
})
export class SyncDaemon {
  private going: boolean
  private initialPass: boolean
  private static readonly ms = 10000

  constructor (
    private readonly serverService: ServerService,
    private readonly serverModel: S9ServerModel,
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

        let serverClone = deepCloneObject({ ...server, updating: true })

        // save "updating: true" on the cached version of the server
        this.serverModel.cacheServer(serverClone)

        try {
          const [serverRes, apps] = await Promise.all([
            this.serverService.getServer(server),
            this.serverService.getInstalledApps(server),
          ])

          serverClone = {
            ...serverClone,
            ...serverRes,
          }

          apps.forEach(app => {
            this.serverModel.cacheApp(serverClone.id, app)
          })


        } catch (e) {
          // @TODO create function for resetting s9Server to initial state
          serverClone = {
            ...serverClone,
            status: this.initialPass ? AppHealthStatus.UNKNOWN : AppHealthStatus.UNREACHABLE,
            statusAt: new Date(),
            apps: [],
            sshKeys: [],
            specs: { },
          }
        }

        serverClone.updating = false

        await this.serverModel.updateServer(serverClone)
      }))

      await pauseFor(SyncDaemon.ms)

      this.initialPass = false
    }
  }

  stop () {
    this.going = false
  }
}
