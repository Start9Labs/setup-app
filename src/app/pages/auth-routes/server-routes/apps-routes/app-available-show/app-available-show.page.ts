import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AppAvailableFull, AppModel } from 'src/app/models/app-model'
import { ApiService } from 'src/app/services/api.service'
import { NavController, AlertController, LoadingController } from '@ionic/angular'
import * as compareVersions from 'compare-versions'
import { pauseFor, getIcon } from 'src/app/util/misc.util'
import { ServerAppModel } from 'src/app/models/server-app-model'

@Component({
  selector: 'app-available-show',
  templateUrl: './app-available-show.page.html',
  styleUrls: ['./app-available-show.page.scss'],
})
export class AppAvailableShowPage {
  loading = true
  error = ''
  serverId: string
  app: AppAvailableFull = { } as AppAvailableFull
  appModel: AppModel
  compareVersions = compareVersions
  getIcon = getIcon

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverAppModel: ServerAppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    const appId = this.route.snapshot.paramMap.get('appId') as string
    this.appModel = this.serverAppModel.get(this.serverId)

    try {
      const [app] = await Promise.all([
        this.apiService.getAvailableApp(this.serverId, appId),
        pauseFor(600),
      ])
      this.app = app
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async presentAlertVersions () {
    const alert = await this.alertCtrl.create({
      header: 'Versions',
      backdropDismiss: false,
      inputs: this.app.versions.map(v => {
        return {
          name: v, // for CSS
          type: 'radio',
          label: v, // appearance on screen
          value: v, // literal SEM version value
          checked: this.app.versionViewing === v,
        }
      }),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Ok',
          handler: (version: string) => {
            this.getVersionInfo(version)
          },
        },
      ],
    })

    await alert.present()
  }

  async getVersionInfo (version: string) {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const info = await this.apiService.getAvailableAppVersionInfo(this.serverId, this.app.id, version)
      Object.assign(this.app, info)
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertInstall () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Install ${this.app.title} ${this.app.versionViewing} to Embassy?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Install',
          cssClass: 'alert-success',
          handler: () => {
            this.install()
          },
        },
      ],
    })
    await alert.present()
  }

async presentAlertDowngrade () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Downgrade ${this.app.title} from ${this.app.versionInstalled} to ${this.app.versionViewing}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Downgrade',
          cssClass: 'alert-success',
          handler: () => {
            this.install()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertUpdate () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Update ${this.app.title} from ${this.app.versionInstalled} to ${this.app.versionViewing}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          cssClass: 'alert-success',
          handler: () => {
            this.install(true)
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertUninstall () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Uninstall ${this.app.title}? All app data will be permanently deleted.`,
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

  async install (isUpdate = false) {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const installed = await this.apiService.installApp(this.serverId, this.app.id, this.app.versionViewing)
      if (isUpdate) {
        this.appModel.updateApp(installed)
      } else {
        this.appModel.createApp(installed)
      }
      await this.navCtrl.navigateBack(['/auth', 'servers', this.serverId])
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async uninstall (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Uninstalling...`,
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.apiService.uninstallApp(this.serverId, this.app.id)
      this.appModel.removeApp(this.app.id)
      await this.navCtrl.navigateBack(['/auth', 'servers', this.serverId])
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
