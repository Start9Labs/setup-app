import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
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

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(serverId) as S9Server
      if (!server) throw new Error (`No server found with ID: ${serverId}`)

      this.server = server
    } catch (e) {
      this.error = e.message
    }
  }

  async copyTor () {
    await this.clipboardService.copy(this.server.torAddress)
  }
}
