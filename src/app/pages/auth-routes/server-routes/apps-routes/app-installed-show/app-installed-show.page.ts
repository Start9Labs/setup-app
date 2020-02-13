import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { AppInstalled, AppStatus, AppModel } from 'src/app/models/app-model'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ActionSheetButton } from '@ionic/core'
import { BehaviorSubject } from 'rxjs'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerAppModel } from 'src/app/models/server-app-model'
import { PropertySubject, peekProperties } from 'src/app/util/property-subject.util'

@Component({
  selector: 'app-installed-show',
  templateUrl: './app-installed-show.page.html',
  styleUrls: ['./app-installed-show.page.scss'],
})
export class AppInstalledShowPage {
  loading = true
  error = ''
  app: PropertySubject<AppInstalled>
  appId: string
  serverId: string
  appModel: AppModel

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly actionCtrl: ActionSheetController,
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly serverAppModel: ServerAppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string
    this.appModel = this.serverAppModel.get(this.serverId)
    this.app = this.appModel.watchAppProperties(this.appId)

    await Promise.all([
      this.getApp(),
      pauseFor(600),
    ])

    this.loading = false
  }

  async doRefresh (event: any) {
    await Promise.all([
      this.getApp(),
      pauseFor(600),
    ])
    event.target.complete()
  }

  async getApp (): Promise<void> {
    try {
      const appRes = await this.serverService.getInstalledApp(this.serverId, this.appId)
      this.app = this.app || this.appModel.watchAppProperties(this.appId)
      this.appModel.updateApp({ id: this.appId, ...appRes})
      this.error = ''
    } catch (e) {
      this.error = e.message
    }
  }

  async copyTor () {
    const app = peekProperties(this.app)
    await this.clipboardService.copy(app.torAddress || '')
  }

  async presentAction () {
    const app = peekProperties(this.app)
    const buttons : ActionSheetButton[] = []

    if (([
      AppStatus.NEEDS_CONFIG,
      AppStatus.RECOVERABLE,
      AppStatus.RUNNING,
      AppStatus.STOPPED,
      AppStatus.RESTARTING,
    ]).includes(app.status!)) {
      buttons.push(
        {
          text: 'App Config',
          icon: 'construct-outline',
          handler: () => {
            this.navigate(['config'])
          },
        },
      )
    }

    buttons.push(
      {
        text: 'View Logs',
        icon: 'newspaper-outline',
        handler: () => {
          this.navigate(['logs'])
        },
      },
      {
        text: 'Store Listing',
        icon: 'aperture-outline',
        handler: () => {
          this.navigate(['/auth', 'servers', this.serverId, 'apps', 'available', app.id])
        },
      },
    )

    if (app.versionInstalled && app.status !== AppStatus.INSTALLING) {
      buttons.push({
        text: 'Uninstall',
        cssClass: 'alert-danger',
        icon: 'trash-outline',
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

  async stop (): Promise<void> {
    const app = peekProperties(this.app)
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
    const app = peekProperties(this.app)
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
    const app = peekProperties(this.app)
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
    const app = peekProperties(this.app)
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

  private async navigate (path: string[]): Promise<void> {
    await this.navCtrl.navigateForward(path, { relativeTo: this.route })
  }
}
