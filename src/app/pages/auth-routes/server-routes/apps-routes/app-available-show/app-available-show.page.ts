import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { AppAvailableFull } from 'src/app/models/app-model'
import { ServerService } from 'src/app/services/server.service'
import { NavController, AlertController, LoadingController } from '@ionic/angular'
import * as compareVersions from 'compare-versions'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'

@Component({
  selector: 'app-available-show',
  templateUrl: './app-available-show.page.html',
  styleUrls: ['./app-available-show.page.scss'],
})
export class AppAvailableShowPage {
  loading = true
  error: string
  serverId: string
  app: AppAvailableFull = { } as AppAvailableFull
  compareVersions = compareVersions

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    try {
      this.serverId = this.route.snapshot.paramMap.get('serverId') as string

      const appId = this.route.snapshot.paramMap.get('appId') as string
      this.app = await this.serverService.getAvailableApp(this.serverId, appId)
    } catch (e) {
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
      const info = await this.serverService.getAvailableAppVersionInfo(this.serverId, this.app.id, version)
      Object.assign(this.app, info)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertInstall () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to install ${this.app.title} ${this.app.versionViewing}?`,
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
          handler: () => {
            this.uninstall()
          },
        },
      ],
    })
    await alert.present()
  }

  async install () {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.installApp(this.serverId, this.app.id, this.app.versionViewing)
      await this.navCtrl.navigateBack(['/auth', 'servers', this.serverId])
    } catch (e) {
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
      await this.serverService.uninstallApp(this.serverId, this.app.id)
      await this.navCtrl.navigateBack(['/auth', 'servers', this.serverId])
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
