import { Component } from '@angular/core'
import { ServerModel } from 'src/app/models/server-model'
import { ServerDaemon } from 'src/app/daemons/server-daemon'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {

  constructor (
    public serverModel: ServerModel,
    public serverDaemon: ServerDaemon,
  ) { }

  async doRefresh (event: any) {
    await this.serverDaemon.syncServers()
    event.target.complete()
  }
}
