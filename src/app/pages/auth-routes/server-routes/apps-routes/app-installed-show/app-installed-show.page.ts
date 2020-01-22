import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { AppInstalled, AppHealthStatus, AppModel } from 'src/app/models/app-model'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ActionSheetButton } from '@ionic/core'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-installed-show',
  templateUrl: './app-installed-show.page.html',
  styleUrls: ['./app-installed-show.page.scss'],
})
export class AppInstalledShowPage {
  loading = true
  error: string
  app$: Observable<AppInstalled>
  appId: string
  serverId: string

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly actionCtrl: ActionSheetController,
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string
    this.app$ = this.appModel.watch(this.serverId, this.appId)

    await this.getApp()
  }

  async getApp (): Promise<void> {
    try {
      const appRes = await this.serverService.getInstalledApp(this.serverId, this.appId)
      this.appModel.update(this.serverId, this.appId, appRes)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async copyTor () {
    const app = this.appModel.peek(this.serverId, this.appId)
    await this.clipboardService.copy(app.torAddress || '')
  }

  async presentAction () {
    const app = this.appModel.peek(this.serverId, this.appId)
    const buttons : ActionSheetButton[] = []

    if (([
      AppHealthStatus.NEEDS_CONFIG,
      AppHealthStatus.RECOVERABLE,
      AppHealthStatus.RUNNING,
      AppHealthStatus.STOPPED,
      AppHealthStatus.RESTARTING,
    ]).includes(app.status!)) {
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
          this.navCtrl.navigateForward(['/auth', 'servers', this.serverId, 'apps', 'available', app.id])
        },
      },
    )

    if (app.versionInstalled && app.status !== AppHealthStatus.INSTALLING) {
      buttons.push({
        text: 'Uninstall',
        cssClass: 'alert-danger',
        icon: 'trash',
        handler: () => {
          this.presentAlertUninstall()
        },
      })
    }

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async handleReinstall () {
    this.navCtrl.navigateForward(['/auth', 'server', this.serverId, 'apps', 'available', this.appId])
  }

  async stop (): Promise<void> {
    const app = this.appModel.peek(this.serverId, this.appId)
    const loader = await this.loadingCtrl.create({
      message: `Stopping ${app.title}. This could take a while...`,
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.stopApp(this.serverId, app)

    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async start (): Promise<void> {
    const app = this.appModel.peek(this.serverId, this.appId)
    const loader = await this.loadingCtrl.create({
      message: `Starting ${app.title}...`,
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.startApp(this.serverId, app)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertUninstall () {
    const app = this.appModel.peek(this.serverId, this.appId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to uninstall ${app.title}?`,
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
    const app = this.appModel.peek(this.serverId, this.appId)
    const loader = await this.loadingCtrl.create({
      message: `Uninstalling ${app.title}`,
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.uninstallApp(this.serverId, this.appId)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
