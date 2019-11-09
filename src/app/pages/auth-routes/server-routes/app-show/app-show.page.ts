import { Component } from '@angular/core'
import { AlertController, NavController } from '@ionic/angular'
import { AppService } from 'src/app/services/app.service'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { InstalledApp } from 'src/app/models/s9-app'
import { S9Server } from 'src/app/models/s9-server'

@Component({
  selector: 'app-app-show',
  templateUrl: './app-show.page.html',
  styleUrls: ['./app-show.page.scss'],
})
export class AppShowPage {
  server: S9Server
  app: InstalledApp

  constructor (
    private readonly alertCtrl: AlertController,
    private readonly appService: AppService,
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)

    const appId = this.route.snapshot.paramMap.get('appId') as string
    const app = server.apps.find(app => app.id === appId)
    if (!app) throw new Error (`No app found on ${serverId} with ID: ${appId}`)

    this.server = server
    this.app = app
  }

  async presentAlertUninstall () {
    const alert = await this.alertCtrl.create({
      header: 'Caution!',
      message: `Are you sure you want to uninstall ${this.app.displayName}`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Uninstall',
          cssClass: 'alert-danger',
          handler: async () => {
            await this.appService.uninstall(this.server, this.app)
            await this.navCtrl.pop()
          },
        },
      ],
    })
    await alert.present()
  }
}
