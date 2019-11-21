import { Component } from '@angular/core'
import { ServerService } from 'src/app/services/server.service'
import { AvailableApp } from 'src/app/models/s9-app'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'app-available-apps',
  templateUrl: './available-apps.page.html',
  styleUrls: ['./available-apps.page.scss'],
})
export class AvailableAppsPage {
  server: S9Server
  apps: AvailableApp[] = []

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
