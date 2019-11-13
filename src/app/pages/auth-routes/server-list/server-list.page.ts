import { Component } from '@angular/core'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9ServerBuilder, hasAll } from 'src/app/models/s9-server'
import { AppService } from 'src/app/services/app.service'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: S9ServerBuilder[]

  constructor (
    private readonly serverModel: S9ServerModel,
    private readonly appService: AppService,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.getServers()
  }

  ionViewWillEnter () {
    this.servers = this.serverModel.getServers()
  }
}
