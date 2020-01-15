import { Component, ViewChild, NgZone } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { S9Server } from 'src/app/models/server-model'
import { AppInstalled, AppModel } from 'src/app/models/app-model'
import { IonContent } from '@ionic/angular'

@Component({
  selector: 'app-logs',
  templateUrl: './app-logs.page.html',
  styleUrls: ['./app-logs.page.scss'],
})
export class AppLogsPage {
  @ViewChild(IonContent, { static: false }) private content: IonContent
  loading = true
  error: string | undefined
  server: S9Server
  app: AppInstalled
  logs: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly serverService: ServerService,
    private readonly zone: NgZone,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    const appId = this.route.snapshot.paramMap.get('appId') as string
    const app = this.appModel.getApp(serverId, appId)
    if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)
    this.app = app

    await this.getLogs()
  }

  async getLogs () {
    this.loading = true
    this.logs = ''

    try {
      const logs = await this.serverService.getAppLogs(this.server, this.app.id)
      this.logs = logs.join('\n\n')
      this.loading = false
      setTimeout(async () => await this.content.scrollToBottom(100), 200)
    } catch (e) {
      this.error = e.message
      this.loading = false
    }
  }

}
