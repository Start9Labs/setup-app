import { Component } from '@angular/core'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: S9Server[]

  constructor (
    private readonly serverModel: S9ServerModel,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.getServers()
  }
}
