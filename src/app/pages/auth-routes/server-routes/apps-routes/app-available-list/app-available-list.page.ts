import { Component } from '@angular/core'
import { ServerService } from 'src/app/services/server.service'
import { AppAvailablePreview } from 'src/app/models/app-model'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'

@Component({
  selector: 'app-available-list',
  templateUrl: './app-available-list.page.html',
  styleUrls: ['./app-available-list.page.scss'],
})
export class AppAvailableListPage {
  loading = true
  error: string
  server: S9Server
  apps: AppAvailablePreview[] = []

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.peekServer(serverId)
      if (!server) throw new Error (`No server found with ID: ${serverId}`)
      this.server = server

      this.apps = await this.serverService.getAvailableApps(this.server)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }
}
