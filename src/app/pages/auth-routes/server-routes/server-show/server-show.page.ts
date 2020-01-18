import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { ActionSheetButton } from '@ionic/core'
import { AppHealthStatus, AppInstalled, AppModel } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'
import { ServerDaemon } from 'src/app/daemons/server-daemon'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error: string
  view: 'apps' | 'about' = 'apps'
  server: S9Server
  apps: AppInstalled[]
  loading = true
  compareVersions = compareVersions

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly serverDaemon: ServerDaemon,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server
    this.apps = this.appModel.getApps(serverId)
    this.getServerAndApps()
  }

  async doRefresh (event: any) {
    await this.getServerAndApps()
    event.target.complete()
  }

  async getServerAndApps () {
    this.loading = true

    await Promise.all([
      this.serverDaemon.syncServer(this.server),
      this.getApps(),
    ])

    this.loading = false
  }

  async getApps (): Promise<void> {
    try {
      const apps = await this.serverService.getInstalledApps(this.server)
      // clear cache of removed apps
      this.appModel.getApps(this.server.id).forEach((app, index) => {
        if (!apps.find(a => a.id === app.id)) {
          this.appModel.getApps(this.server.id).splice(index, 1)
        }
      })
      // update cache with new app data
      apps.forEach(app => {
        this.appModel.cacheApp(this.server.id, app)
      })
    } catch (e) {
      this.appModel.getApps(this.server.id).forEach(app => {
        app.status = AppHealthStatus.UNREACHABLE
        app.statusAt = new Date()
      })
    }
  }

  async presentAction () {
    const buttons: ActionSheetButton[] = [
      {
        text: 'Edit friendly name',
        icon: 'pricetag',
        handler: () => {
          this.presentAlertEditName()
        },
      },
    ]

    if (this.server.status === AppHealthStatus.RUNNING) {
      buttons.push(
        {
          text: 'Server info',
          icon: 'information-circle-outline',
          handler: () => {
            this.navCtrl.navigateForward(['specs'], { relativeTo: this.route })
          },
        },
        {
          text: 'Server metrics',
          icon: 'pulse',
          handler: () => {
            this.navCtrl.navigateForward(['metrics'], { relativeTo: this.route })
          },
        },
        {
          text: 'Developer options',
          icon: 'code',
          handler: () => {
            this.navCtrl.navigateForward(['developer-options'], { relativeTo: this.route })
          },
        },
      )
    }

    buttons.push(
      {
        text: 'Restart',
        icon: 'refresh',
        handler: () => {
          this.presentAlertRestart()
        },
      },
      {
        text: 'Shutdown',
        icon: 'power',
        handler: () => {
          this.presentAlertShutdown()
        },
      },
      {
        text: 'Forget',
        cssClass: 'alert-danger',
        icon: 'trash',
        handler: () => {
          this.presentAlertForget()
        },
      },
    )

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async presentAlertEditName () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Friendly Name',
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          value: this.server.label,
          placeholder: '(ex. My Server)',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const inputValue = data.inputValue
            // return if no change
            if (this.server.label === inputValue) { return }
            // throw error if no server name
            if (!inputValue) {
              alert.message = 'Server must have a name'
              return false
            }
            this.server.label = inputValue
            this.serverModel.saveAll()
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertUpdate () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Update Agent OS to ${this.server.versionLatest}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          handler: async () => {
            this.update()
          },
        },
      ],
    })
    await alert.present()
  }

  async update () {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.updateAgent(this.server)
      this.server.status = AppHealthStatus.DOWNLOADING
      this.server.statusAt = new Date()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertRestart () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to restart ${this.server.label}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Restart',
          cssClass: 'alert-danger',
          handler: async () => {
            this.restart()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertShutdown () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to shut down ${this.server.label}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Shutdown',
          cssClass: 'alert-danger',
          handler: async () => {
            this.shutdown()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to forget ${this.server.label} on this device?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Forget Server',
          cssClass: 'alert-danger',
          handler: async () => {
            this.forget()
          },
        },
      ],
    })
    await alert.present()
  }

  async restart () {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      message: `Restarting ${this.server.label}...`,
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.restartServer(this.server)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async shutdown () {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      message: `Shutting down ${this.server.label}...`,
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.shutdownServer(this.server)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async forget () {
    await this.serverModel.forgetServer(this.server.id)
    await this.navCtrl.navigateRoot(['/auth'])
  }
}
