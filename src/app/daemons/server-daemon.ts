import { Injectable } from '@angular/core'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerSyncService } from '../services/server.sync.service'

@Injectable({
  providedIn: 'root',
})
export class ServerDaemon {
  private going: boolean
  syncInterval = 5000

  constructor (
    private readonly sss: ServerSyncService,
  ) { }

  async start (): Promise<void> {
    if (!this.going) this.poll()
  }

  private async poll () {
    this.going = true


    while (this.going) {
      this.sss.fromCache().syncServers()
      await pauseFor(this.syncInterval)
    }
  }

  stop () {
    this.going = false
    this.sss.clearCache()
  }
}

