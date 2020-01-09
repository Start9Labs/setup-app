import { Component } from '@angular/core'
import { NavController, LoadingController, AlertController } from '@ionic/angular'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { AppInstalled, AppConfigSpec, AppHealthStatus } from 'src/app/models/s9-app'
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
  initialConfigStringified: string
  config: object
  edited = false

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
  ) {
  }

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
      this.initialConfigStringified = JSON.stringify(this.config)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async cancel () {
    if (JSON.stringify(this.config) !== this.initialConfigStringified) {
      await this.presentAlertUnsaved()
    } else {
      await this.navigateBack()
    }
  }

  async save () {
    const loader = await this.loadingCtrl.create({
      message: 'Saving config...',
    })
    await loader.present()

    try {
      // save config
      await this.serverService.updateAppConfig(this.server, this.app, this.config)

      // if status was RUNNING beforehand, restart the app
      if (this.app.status = AppHealthStatus.RUNNING) {
        loader.message = `Restarting ${this.app.title}. This could take a while...`
        // stop app
        await this.serverService.stopApp(this.server, this.app)
        // start app
        await this.serverService.startApp(this.server, this.app)
      // if not RUNNING beforehand, set status to STOPPED
      } else {
        this.app.status = AppHealthStatus.STOPPED
        this.app.statusAt = new Date()
      }

      await this.navigateBack()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertUnsaved () {
    const alert = await this.alertCtrl.create({
      header: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      buttons: [
        {
          text: `Leave`,
          cssClass: 'alert-danger',
          handler: () => {
            this.navigateBack()
          },
        },
        {
          text: 'Stay Here',
          role: 'cancel',
        },
      ],
    })
    await alert.present()
  }

  async navigateBack () {
    return this.navCtrl.navigateBack(`/servers/${this.server.id}/apps/installed/${this.app.id}`)
  }
}
