import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { S9Server } from 'src/app/models/s9-server'
import { AppInstalled } from 'src/app/models/s9-app'

@Component({
  selector: 'app-app-logs',
  templateUrl: './app-logs.page.html',
  styleUrls: ['./app-logs.page.scss'],
})
export class AppLogsPage {
  loading = true
  error: string | undefined
  server: S9Server
  app: AppInstalled
  logs: string[] = []
  lastDate = new Date(new Date().valueOf() - 10000)
  page = 1

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    const appId = this.route.snapshot.paramMap.get('appId') as string
    const app = server.apps.find(app => app.id === appId)
    if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)
    this.app = app

    await this.getLogs()
  }

  async getLogs () {
    this.loading = true
    try {
      this.logs = await this.serverService.getAppLogs(this.server, this.app.id, { after: this.lastDate.toISOString(), page: this.page.toString() })
      this.lastDate = new Date()
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

}
