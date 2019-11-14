import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { InstalledApp } from 'src/app/models/s9-app'
import { S9Server } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'

@Component({
  selector: 'app-start9-agent',
  templateUrl: './start9-agent.page.html',
  styleUrls: ['./start9-agent.page.scss'],
})
export class Start9AgentPage {
  error: string
  server: S9Server
  app: InstalledApp

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId) as S9Server
    if (!server) throw new Error (`No server found with ID: ${serverId}`)

    const app = server.apps.find(app => app.id === 'start9Agent')
    if (!app) throw new Error (`Start9 Agent app not found`)

    this.server = server
    this.app = app
    console.log(this.app)
  }

  async copyTor () {
    await this.clipboardService.copy(this.server.torAddress)
  }
}
