import { Component } from '@angular/core'
import { AppService } from 'src/app/services/app.service'
import { AvailableApp } from 'src/app/models/installed-app'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'app-available-apps',
  templateUrl: './available-apps.page.html',
  styleUrls: ['./available-apps.page.scss'],
})
export class AvailableAppsPage {
  server: S9Server
  apps: AvailableApp[] = []

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly appService: AppService,
    private readonly navCtrl: NavController,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    this.apps = await this.appService.getAvailableApps(this.server)
  }

  async install (app: AvailableApp) {
    await this.appService.install(this.server, app)
    await this.navCtrl.pop()
  }
}
