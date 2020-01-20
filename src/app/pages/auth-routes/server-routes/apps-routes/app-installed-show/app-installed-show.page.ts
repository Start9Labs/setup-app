import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { AppInstalled, AppHealthStatus, AppModel } from 'src/app/models/app-model'
import { S9Server } from 'src/app/models/server-model'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ActionSheetButton } from '@ionic/core'
import { AppDaemon } from 'src/app/daemons/app-daemon'
import { serverFromRouteParam } from '../../server-helpers'

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
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
    private readonly appDaemon: AppDaemon,
  ) { }

  async ngOnInit () {
    try {
      this.server = serverFromRouteParam(
        this.route, this.serverModel,
      )

      this.appDaemon.setAndGo(this.server)

      const appId = this.route.snapshot.paramMap.get('appId') as string
      this.app = this.appModel.getApp(this.server.id, appId) || { } as Readonly<AppInstalled>

      this.getApp(appId)
    } catch (e) {
      this.error = e.message
    }
  }

  async ngOnDestroy () {
    this.appDaemon.stop()
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

    if ([AppHealthStatus.NEEDS_CONFIG, AppHealthStatus.RECOVERABLE, AppHealthStatus.RUNNING, AppHealthStatus.STOPPED, AppHealthStatus.RESTARTING].includes(this.app.status)) {
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
