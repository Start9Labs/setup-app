import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel, clone } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { AlertController, LoadingController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import * as compareVersions from 'compare-versions'
import { AppHealthStatus } from 'src/app/models/s9-app'

@Component({
  selector: 'app-start9-agent',
  templateUrl: './start9-agent.page.html',
  styleUrls: ['./start9-agent.page.scss'],
})
export class Start9AgentPage {
  error: string
  server: S9Server
  compareVersions = compareVersions

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly clipboardService: ClipboardService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
  ) { }

  ngOnInit () {
    try {
      const serverId = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(serverId) as S9Server
      if (!server) throw new Error (`No server found with ID: ${serverId}`)

      this.server = server
    } catch (e) {
      this.error = e.message
    }
  }

  async copyTor () {
    await this.clipboardService.copy(this.server.torAddress)
  }

  async presentAlertUpdate () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: `Update Agent to ${this.server.versionLatest}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          handler: async () => {
            this.update()
          },
        },
      ],
    })
    await alert.present()
  }

  async update () {
    const loader = await this.loadingCtrl.create()
    await loader.present()

    try {
      await this.serverService.updateAgent(this.server)
      this.serverModel.saveServer({ ...this.server, status: AppHealthStatus.DOWNLOADING })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
