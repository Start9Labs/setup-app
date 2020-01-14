import { Injectable } from '@angular/core'
import { ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerService } from '../services/server.service'
import { AppHealthStatus } from '../models/app-model'

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
          console.log('SYNC making request')
          const serverRes = await this.serverService.getServer(server)
          Object.assign(server, serverRes)
          await this.serverModel.saveAll()
        } catch (e) {
          console.log(this.initialPass)
          server.status = this.initialPass ? AppHealthStatus.UNKNOWN : AppHealthStatus.UNREACHABLE
          server.statusAt = new Date()
        }

        server.updating = false
      }))

      await pauseFor(SyncDaemon.ms)

      this.initialPass = false
    }
  }

  stop () {
    this.going = false
  }
}
