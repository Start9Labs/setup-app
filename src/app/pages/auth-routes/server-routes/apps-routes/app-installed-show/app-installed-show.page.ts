import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { AppInstalled, AppHealthStatus, AppModel } from 'src/app/models/app-model'
import { S9Server } from 'src/app/models/server-model'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ActionSheetButton } from '@ionic/core'

@Component({
  selector: 'app-installed-show',
  templateUrl: './app-installed-show.page.html',
  styleUrls: ['./app-installed-show.page.scss'],
})
export class AppInstalledShowPage {
  loading = true
  error: string
  server: S9Server
  app: AppInstalled

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly actionCtrl: ActionSheetController,
    private readonly serverService: ServerService,
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly appModel: AppModel,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(serverId)
      if (!server) throw new Error (`No server found with ID: ${serverId}`)
      this.server = server

      const appId = this.route.snapshot.paramMap.get('appId') as string
      this.app = this.appModel.getApp(serverId, appId) || { } as Readonly<AppInstalled>

      this.getApp(appId)
    } catch (e) {
      this.error = e.message
    }
  }

  async getApp (appId: string): Promise<void> {
    try {
      this.app = await this.serverService.getInstalledApp(this.server, appId)
      this.appModel.cacheApp(this.server.id, this.app)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
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
          text: 'App Config',
          icon: 'construct',
          handler: () => {
            this.navCtrl.navigateForward(['config'], { relativeTo: this.route })
          },
        },
      )
    }

    buttons.push(
      {
        text: 'View Logs',
        icon: 'paper',
        handler: () => {
          this.navCtrl.navigateForward(['logs'], { relativeTo: this.route })
        },
      },
      {
        text: 'Store Listing',
        icon: 'appstore',
        handler: () => {
          this.navCtrl.navigateForward(['/auth', 'servers', this.server.id, 'apps', 'available', this.app.id])
        },
      },
    )

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
      spinner: 'lines',
      cssClass: 'loader',
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
      spinner: 'lines',
      cssClass: 'loader',
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
      spinner: 'lines',
      cssClass: 'loader',
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
