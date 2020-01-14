import { Component } from '@angular/core'
import { NavController, LoadingController, AlertController } from '@ionic/angular'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { AppInstalled, AppConfigSpec, AppHealthStatus, AppModel } from 'src/app/models/app-model'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'app-config',
  templateUrl: './app-config.page.html',
  styleUrls: ['./app-config.page.scss'],
})
export class AppConfigPage {
  loading = false
  error: string
  server: S9Server
  app: AppInstalled
  spec: AppConfigSpec
  config: object
  edited = false

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
  ) {
  }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    const appId = this.route.snapshot.paramMap.get('appId') as string
    const app = this.appModel.getApp(serverId, appId)
    if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)
    this.app = app

    if (this.app.status === AppHealthStatus.RECOVERABLE) {
      await this.presentAlertRecoverable()
      this.edited = true
    } else {
      await this.getConfig()
    }
  }

  async getConfig () {
    this.loading = true
    try {
      const { spec, config } = await this.serverService.getAppConfig(this.server, this.app.id)
      this.spec = spec
      this.config = config
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async cancel () {
    if (this.edited) {
      await this.presentAlertUnsaved()
    } else {
      await this.navigateBack()
    }
  }

  async save () {
    const loader = await this.loadingCtrl.create({
      message: 'Saving config...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      // save config
      await this.serverService.updateAppConfig(this.server, this.app, this.config)

      // if status was RUNNING beforehand, restart the app
      if (this.app.status === AppHealthStatus.RUNNING) {
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

  async presentAlertRecoverable () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Keep existing data?',
      message: `Data for ${this.app.title} was found on this device. Would you like to keep it?`,
      buttons: [
        {
          text: `Wipe Data`,
          cssClass: 'alert-danger',
          handler: () => {
            this.presentAlertConfirmWipeData()
          },
        },
        {
          text: 'Keep Data',
          handler: () => {
            this.getConfig()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertConfirmWipeData () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to wipe data for ${this.app.title}? It will be treated as a fresh install.`,
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            this.getConfig()
          },
        },
        {
          text: `Wipe Data`,
          cssClass: 'alert-danger',
          handler: () => {
            this.wipeAppData()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertUnsaved () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
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

  async wipeAppData () {
    const loader = await this.loadingCtrl.create({
      message: 'Wiping Data. This could take a while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.wipeAppData(this.server, this.app)
      await this.getConfig()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async navigateBack () {
    return this.navCtrl.navigateBack(['/servers', this.server.id, 'apps', 'installed', this.app.id])
  }
}
