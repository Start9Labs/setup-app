import { Component, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerService } from 'src/app/services/server.service'
import { AppModel } from 'src/app/models/app-model'
import { IonContent } from '@ionic/angular'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'app-logs',
  templateUrl: './app-logs.page.html',
  styleUrls: ['./app-logs.page.scss'],
})
export class AppLogsPage {
  @ViewChild(IonContent, { static: false }) private content: IonContent
  loading = true
  error = ''
  serverId: string
  appId: string
  logs: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly appModel: AppModel,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string

    await Promise.all([
      this.getLogs(true),
      pauseFor(600),
    ])

    this.loading = false
  }

  async getLogs (initialLoad = false) {
    const app = this.appModel.peek(this.serverId, this.appId)
    this.loading = true
    this.logs = ''

    try {
      const logs = await this.serverService.getAppLogs(this.serverId, app.id)
      this.logs = logs.join('\n\n')
      this.error = ''
      setTimeout(async () => await this.content.scrollToBottom(100), 200)
    } catch (e) {
      this.error = e.message
    } finally {
      if (!initialLoad) { this.loading = false }
    }
  }

}
