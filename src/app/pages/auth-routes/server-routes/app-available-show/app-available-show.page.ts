import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/s9-server'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { AvailableAppFull } from 'src/app/models/s9-app'
import { ServerService } from 'src/app/services/server.service'
import { NavController, AlertController, LoadingController } from '@ionic/angular'

@Component({
  selector: 'app-app-available-show',
  templateUrl: './app-available-show.page.html',
  styleUrls: ['./app-available-show.page.scss'],
})
export class AppAvailableShowPage {
  loading = true
  error: string
  server: S9Server
  app: AvailableAppFull

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly serverService: ServerService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId) as S9Server
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    const appId = this.route.snapshot.paramMap.get('appId') as string

    this.app = await this.serverService.getAvailableApp(this.server, appId)
    this.loading = false
  }

  async presentAlertInstall (version: string) {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to install ${this.app.title}, version ${version}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Install',
          cssClass: 'alert-success',
          handler: () => { this.install(version) },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertUninstall () {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to uninstall ${this.app.title}, version ${this.app.versionInstalled}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Uninstall',
          cssClass: 'alert-danger',
          handler: () => { this.uninstall() },
        },
      ],
    })
    await alert.present()
  }

  async install (version: string) {
    const loader = await this.loadingCtrl.create({
      message: `Installing`,
    })
    await loader.present()

    try {
      await this.serverService.install(this.server, this.app.id, version)
      await this.navCtrl.navigateBack(['/servers', this.server.id])
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async uninstall (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Uninstalling`,
    })
    await loader.present()

    try {
      await this.serverService.uninstall(this.server, this.app.id)
      await this.navCtrl.navigateBack(['/servers', this.server.id])
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
