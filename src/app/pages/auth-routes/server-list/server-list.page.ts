import { Component } from '@angular/core'
import { ServerModel } from 'src/app/models/server-model'
import { SyncDaemon } from 'src/app/daemons/sync-daemon'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {

  constructor (
    public serverModel: ServerModel,
    public syncDaemon: SyncDaemon,
  ) { }

  async doRefresh (event: any) {
    await this.syncDaemon.syncServers()
    event.target.complete()
  }
}
