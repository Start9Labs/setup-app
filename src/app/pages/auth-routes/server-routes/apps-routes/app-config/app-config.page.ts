import { Component } from '@angular/core'
import { NavController, LoadingController, AlertController } from '@ionic/angular'
import { ActivatedRoute } from '@angular/router'
import { AppInstalled, AppConfigSpec, AppStatus, AppModel } from 'src/app/models/app-model'
import { ServerService } from 'src/app/services/server.service'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerAppModel } from 'src/app/models/server-app-model'
import { PropertySubject, peekProperties } from 'src/app/util/property-subject.util'

@Component({
  selector: 'app-config',
  templateUrl: './app-config.page.html',
  styleUrls: ['./app-config.page.scss'],
})
export class AppConfigPage {
  loading = true
  error = ''
  app: PropertySubject<AppInstalled>
  appId: string
  spec: AppConfigSpec
  config: object
  edited = false
  serverId: string
  appModel: AppModel

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverAppModel: ServerAppModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
  ) {
  }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string
    this.appModel = this.serverAppModel.get(this.serverId)
    this.app = this.appModel.watchAppProperties(this.appId)
    const app = peekProperties(this.app)
    if (app.status === AppStatus.RECOVERABLE) {
      await this.presentAlertRecoverable()
    } else {
      await Promise.all([
        this.getConfig(true),
        pauseFor(600),
      ])
      this.loading = false
    }
  }

  async getConfig (initialLoad = false) {
    this.loading = true
    try {
      const { spec, config } = await this.serverService.getAppConfig(this.serverId, this.appId)
      this.spec = spec
      this.config = config
    } catch (e) {
      this.error = e.message
    } finally {
      if (!initialLoad) { this.loading = false }
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
    const app = peekProperties(this.app)
    const loader = await this.loadingCtrl.create({
      message: 'Saving config...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      // save config
      await this.serverService.updateAppConfig(this.serverId, app, this.config)

      // if status was RUNNING beforehand, restart the app
      if (app.status === AppStatus.RUNNING) {
        loader.message = `Restarting ${app.title}. This could take a while...`
        // stop app
        await this.serverService.stopApp(this.serverId, app)
        // start app
        await this.serverService.startApp(this.serverId, app)
      // if not RUNNING beforehand, set status to STOPPED
      } else {
        this.appModel.updateApp({ id: this.appId, status: AppStatus.STOPPED, statusAt: new Date().toISOString() })
      }

      await this.navigateBack()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertRecoverable () {
    const app = peekProperties(this.app)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Keep existing data?',
      message: `Data for ${app.title} was found on this device. Would you like to keep it?`,
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
            this.edited = true
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertConfirmWipeData () {
    const app = peekProperties(this.app)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to wipe data for ${app.title}? It will be treated as a fresh install.`,
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            this.getConfig()
            this.edited = true
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
    const app = peekProperties(this.app)
    const loader = await this.loadingCtrl.create({
      message: 'Wiping Data. This could take a while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.wipeAppData(this.serverId, app)
      await this.getConfig()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async navigateBack () {
    return this.navCtrl.navigateBack(['/auth', 'servers', this.serverId, 'apps', 'installed', this.appId])
  }
}
