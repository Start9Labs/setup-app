import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController, ActionSheetController, ToastController } from '@ionic/angular'
import { ApiService } from 'src/app/services/api.service'
import { ActivatedRoute } from '@angular/router'
import { AppInstalled, AppStatus, AppModel } from 'src/app/models/app-model'
import { ActionSheetButton } from '@ionic/core'
import { pauseFor } from 'src/app/util/misc.util'
import { ServerAppModel } from 'src/app/models/server-app-model'
import { PropertySubject, peekProperties } from 'src/app/util/property-subject.util'
import { Plugins } from '@capacitor/core'
import * as compareVersions from 'compare-versions'

const { Clipboard } = Plugins

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
  showUpdate = true
  compareVersions = compareVersions

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly actionCtrl: ActionSheetController,
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
    private readonly apiService: ApiService,
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
      const appRes = await this.apiService.getInstalledApp(this.serverId, this.appId)
      this.app = this.app || this.appModel.watchAppProperties(this.appId)
      this.appModel.updateApp({ id: this.appId, ...appRes})
      this.error = ''
    } catch (e) {
      this.error = e.message
    }
  }

  async checkForUpdates () {
    const app = peekProperties(this.app)

    const loader = await this.loadingCtrl.create({
      message: `Checking for updates...`,
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const { versionLatest } = await this.apiService.getAvailableApp(this.serverId, this.appId)
      if (this.compareVersions(versionLatest, app.versionInstalled!) === 1) {
        await this.presentAlertUpdate(app, versionLatest)
      }
      this.showUpdate = false
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertUpdate (app: AppInstalled, versionLatest: string) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Update Available',
      message: `New version ${versionLatest} found for ${app.title}.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'View in Store',
          cssClass: 'alert-success',
          handler: () => {
            this.navigate(['/auth', 'servers', this.serverId, 'apps', 'available', this.appId])
          },
        },
      ],
    })
    await alert.present()
  }

  async copyTor () {
    const app = peekProperties(this.app)
    let message = ''
    await Clipboard.write({ url: app.torAddress || '' })
      .then(() => { message = 'copied to clipboard!' })
      .catch(() => { message = 'failed to copy' })

    const toast = await this.toastCtrl.create({
      header: message,
      position: 'bottom',
      duration: 1000,
      cssClass: 'notification-toast',
    })
    await toast.present()
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

    if (app.status === AppStatus.RUNNING) {
      buttons.push(
        {
          text: 'Logs',
          icon: 'newspaper-outline',
          handler: () => {
            this.navigate(['logs'])
          },
        },
        {
          text: 'Metrics',
          icon: 'pulse',
          handler: () => {
            this.navigate(['metrics'])
          },
        },
      )
    }

    buttons.push(
      {
        text: 'View in Store',
        icon: 'aperture-outline',
        handler: () => {
          this.navigate(['/auth', 'servers', this.serverId, 'apps', 'available', this.appId])
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

  async goToStore () {

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
      await this.apiService.stopApp(this.serverId, this.appId)

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
      await this.apiService.startApp(this.serverId, this.appId)
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
          handler: () => {
            this.uninstall()
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
      await this.apiService.uninstallApp(this.serverId, this.appId)
      this.appModel.removeApp(this.appId)
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
