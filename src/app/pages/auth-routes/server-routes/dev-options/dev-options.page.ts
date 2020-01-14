import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'

@Component({
  selector: 'dev-options',
  templateUrl: 'dev-options.page.html',
  styleUrls: ['dev-options.page.scss'],
})
export class DevOptionsPage {
  server: S9Server

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server
  }
}

