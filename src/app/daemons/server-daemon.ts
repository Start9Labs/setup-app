import { Injectable } from '@angular/core'
import { ServerModel } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { ZeroconfDaemon } from './zeroconf-daemon'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { ServerSyncService } from '../services/server.sync.service'

@Injectable({
  providedIn: 'root',
})
export class ServerDaemon {
  private going: boolean
  syncing: boolean
  syncInterval = 5000

  constructor (
    private readonly serverModel: ServerModel,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly sss: ServerSyncService,
  ) {
    console.log('initial cache', JSON.stringify(this.serverModel.darkCache))
    this.zeroconfDaemon.watch().subscribe(zeroconfService => this.handleZeroconfUpdate(zeroconfService) )
  }

  async start (): Promise<void> {
    if (!this.going) this.poll()
  }

  private async poll () {
    this.going = true


    while (this.going) {
      await this.sss.refreshCache().syncServers()
      await pauseFor(this.syncInterval)
    }
  }

  stop () {
    this.going = false
  }

  async handleZeroconfUpdate (zeroconfService: ZeroconfService | null): Promise<void> {
    if (!zeroconfService) { return }
    try {
      const server = this.serverModel.peek(zeroconfService.name.split('-')[1])
      this.sss.fromCache().syncServer(server, 250)
    } catch (e) {
      console.warn(e.message)
    }
  }
}

