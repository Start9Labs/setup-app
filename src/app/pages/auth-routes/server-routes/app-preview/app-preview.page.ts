import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/s9-server'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { AvailableApp, InstalledApp } from 'src/app/models/s9-app'
import { AppService } from 'src/app/services/app.service'
import { NavController, AlertController, LoadingController } from '@ionic/angular'

@Component({
  selector: 'app-app-preview',
  templateUrl: './app-preview.page.html',
  styleUrls: ['./app-preview.page.scss'],
})
export class AppPreviewPage {
  loading = true
  error: string
  server: S9Server
  app: AvailableApp

  constructor (
    private readonly navCtrl: NavController,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly appService: AppService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId) as S9Server
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    const appId = this.route.snapshot.paramMap.get('appId') as string

    this.app = await this.appService.getApp(this.server, appId)
    this.loading = false
  }

  async presentAlert (action: 'install' | 'uninstall') {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to ${action} ${this.app.title}, version ${this.app.versionInstalled}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          cssClass: action === 'uninstall' ? 'alert-danger' : 'alert-success',
          handler: () => {
            if (action === 'install') {
              this.install()
            } else {
              this.uninstall()
            }
          },
        },
      ],
    })
    await alert.present()
  }

  async install () {
    const loader = await this.loadingCtrl.create({
      message: `Installing`,
    })
    await loader.present()

    try {
      await this.appService.install(this.server, this.app)
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
      await this.appService.uninstall(this.server, this.app)
      await this.navCtrl.navigateBack(['/servers', this.server.id])
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
