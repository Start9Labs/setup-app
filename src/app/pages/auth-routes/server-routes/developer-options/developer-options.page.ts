import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/s9-server'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'

@Component({
  selector: 'page-developer-options',
  templateUrl: 'developer-options.page.html',
  styleUrls: ['developer-options.page.scss'],
})
export class DeveloperOptionsPage {
  server: S9Server

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server
  }
}

