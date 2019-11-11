import { Component } from '@angular/core'
import { AlertController, NavController, LoadingController } from '@ionic/angular'
import { AppService } from 'src/app/services/app.service'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { InstalledApp } from 'src/app/models/s9-app'
import { S9ServerFull } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'

@Component({
  selector: 'app-app-show',
  templateUrl: './app-show.page.html',
  styleUrls: ['./app-show.page.scss'],
})
export class AppShowPage {
  error: string
  server: S9ServerFull
  app: InstalledApp

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly appService: AppService,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
    private readonly clipboardService: ClipboardService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId) as S9ServerFull
    if (!server) throw new Error (`No server found with ID: ${serverId}`)

    const appId = this.route.snapshot.paramMap.get('appId') as string
    const app = server.apps.find(app => app.id === appId)
    if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)

    this.server = server
    this.app = app
  }

  async copyTor () {
    await this.clipboardService.copy(this.server.torAddress)
  }

  async stop (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Stopping ${this.app.displayName}`,
    })
    await loader.present()

    try {
      this.app = await this.appService.stop(this.server, this.app)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async start (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: `Starting ${this.app.displayName}`,
    })
    await loader.present()

    try {
      this.app = await this.appService.start(this.server, this.app)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertUninstall () {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to uninstall ${this.app.displayName}?`,
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
      message: `Uninstalling ${this.app.displayName}`,
    })
    await loader.present()

    try {
      await this.appService.uninstall(this.server, this.app)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
