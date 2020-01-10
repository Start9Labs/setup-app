import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { AppInstalled, AppHealthStatus } from 'src/app/models/s9-app'
import { S9Server } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ActionSheetButton } from '@ionic/core'

@Component({
  selector: 'app-installed-show',
  templateUrl: './app-installed-show.page.html',
  styleUrls: ['./app-installed-show.page.scss'],
})
export class AppInstalledShowPage {
  error: string
  server: S9Server
  app: AppInstalled

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly actionCtrl: ActionSheetController,
    private readonly serverService: ServerService,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(serverId)
      if (!server) throw new Error (`No server found with ID: ${serverId}`)

      const appId = this.route.snapshot.paramMap.get('appId') as string
      const app = server.apps.find(app => app.id === appId)
      if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)

      this.server = server
      this.app = app
    } catch (e) {
      this.error = e.message
    }
  }

  async copyTor () {
    await this.clipboardService.copy(this.app.torAddress || '')
  }

  async presentAction () {
    const buttons : ActionSheetButton[] = []

    if ([AppHealthStatus.NEEDS_CONFIG, AppHealthStatus.RECOVERABLE, AppHealthStatus.RUNNING, AppHealthStatus.STOPPED].includes(this.app.status)) {
      buttons.push(
        {
          text: 'Config',
          icon: 'construct',
          handler: () => {
            this.navCtrl.navigateForward(['/servers', this.server.id, 'apps', 'installed', this.app.id, 'config'])
          },
        },
      )
    }

    buttons.push(
      {
        text: 'Logs',
        icon: 'paper',
        handler: () => {
          this.navCtrl.navigateForward(['/servers', this.server.id, 'apps', 'installed', this.app.id, 'logs'])
        },
      },
      {
        text: 'Store Listing',
        icon: 'appstore',
        handler: () => {
          this.navCtrl.navigateForward(['/servers', this.server.id, 'apps', 'available', this.app.id])
        },
      },
    )

    if (this.app.status === AppHealthStatus.RUNNING) {
      buttons.push({
        text: 'Stop',
        icon: 'square',
        handler: () => {
          this.stop()
        },
      })
    } else if (this.app.status === AppHealthStatus.STOPPED) {
      buttons.push({
        text: 'Start',
        icon: 'play',
        handler: () => {
          this.start()
        },
      })
    }

    buttons.push({
      text: 'Uninstall',
      cssClass: 'alert-danger',
      icon: 'trash',
      handler: () => {
        this.presentAlertUninstall()
      },
    })

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async stop (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Stopping ${this.app.title}. This could take a while...`,
    })
    await loader.present()

    try {
      await this.serverService.stopApp(this.server, this.app)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async start (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Starting ${this.app.title}...`,
    })
    await loader.present()

    try {
      await this.serverService.startApp(this.server, this.app)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertUninstall () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to uninstall ${this.app.title}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Uninstall',
          cssClass: 'alert-danger',
          handler: async () => {
            await this.uninstall()
          },
        },
      ],
    })
    await alert.present()
  }

  async uninstall (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Uninstalling ${this.app.title}`,
    })
    await loader.present()

    try {
      await this.serverService.uninstallApp(this.server, this.app.id)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
