import { Component } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { AppInstalled, AppConfigSpec } from 'src/app/models/s9-app'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'app-app-config',
  templateUrl: './app-config.page.html',
  styleUrls: ['./app-config.page.scss'],
})
export class AppConfigPage {
  loading = true
  error: string
  server: S9Server
  app: AppInstalled
  spec: AppConfigSpec
  config: object
  edited = false

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(serverId)
      if (!server) throw new Error (`No server found with ID: ${serverId}`)
      this.server = server

      const appId = this.route.snapshot.paramMap.get('appId') as string
      const app = server.apps.find(app => app.id === appId)
      if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)
      this.app = app

      const { spec, config } = await this.serverService.getAppConfig(this.server, appId)
      this.spec = spec
      this.config = config
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async save () {
    const loader = await this.loadingCtrl.create({
      message: 'saving config...',
    })
    await loader.present()

    try {
      await this.serverService.updateApp(this.server, this.app, this.config)
      await this.navCtrl.navigateBack(`/servers/${this.server.id}/apps/installed/${this.app.id}`)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
