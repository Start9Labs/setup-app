import { Component } from '@angular/core'
import { ServerService } from 'src/app/services/server.service'
import { AvailableAppPreview } from 'src/app/models/s9-app'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'

@Component({
  selector: 'app-available-apps-list',
  templateUrl: './available-apps-list.page.html',
  styleUrls: ['./available-apps-list.page.scss'],
})
export class AvailableAppsListPage {
  server: S9Server
  apps: AvailableAppPreview[] = []

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId) as S9Server
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    this.apps = await this.serverService.getAvailableApps(this.server)
  }
}
