import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { ActionSheetButton } from '@ionic/core'
import { AppHealthStatus, AppModel } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error: string
  view: 'apps' | 'about' = 'apps'
  loading = true
  compareVersions = compareVersions
  server$: Observable<S9Server>
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly sss: ServerSyncService,
    readonly appModel: AppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server$ = this.serverModel.watch(this.serverId)

    this.getServerAndApps()
  }

  async doRefresh (event: any) {
    await this.getServerAndApps()
    event.target.complete()
  }

  async getServerAndApps () {
    const server = this.serverModel.peek(this.serverId)
    this.loading = true
    await this.sss.fromCache().syncServer(server)
    this.loading = false
  }

  async presentAction () {
    const server = this.serverModel.peek(this.serverId)
    const buttons: ActionSheetButton[] = [
      {
        text: 'Edit friendly name',
        icon: 'pricetag',
        handler: () => {
          this.presentAlertEditName()
        },
      },
    ]

    if (server.status === AppHealthStatus.RUNNING) {
      buttons.push(
        {
          text: 'Server info',
          icon: 'information-circle-outline',
          handler: () => {
            this.navCtrl.navigateForward(['specs'], { relativeTo: this.route })
          },
        },
        {
          text: 'Server metrics',
          icon: 'pulse',
          handler: () => {
            this.navCtrl.navigateForward(['metrics'], { relativeTo: this.route })
          },
        },
        {
          text: 'Developer options',
          icon: 'code',
          handler: () => {
            this.navCtrl.navigateForward(['developer-options'], { relativeTo: this.route })
          },
        },
      )
    }

    buttons.push(
      {
        text: 'Restart',
        icon: 'refresh',
        handler: () => {
          this.presentAlertRestart()
        },
      },
      {
        text: 'Shutdown',
        icon: 'power',
        handler: () => {
          this.presentAlertShutdown()
        },
      },
      {
        text: 'Forget',
        cssClass: 'alert-danger',
        icon: 'trash',
        handler: () => {
          this.presentAlertForget()
        },
      },
    )

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async presentAlertEditName () {
    const server = this.serverModel.peek(this.serverId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Friendly Name',
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          value: server.label,
          placeholder: '(ex. My Server)',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Done',
          handler: (data: { inputValue: string }) => {
            const inputValue = data.inputValue
            // return if no change
            if (server.label === inputValue) { return }
            // throw error if no server name
            if (!inputValue) {
              alert.message = 'Server must have a name'
              return false
            }
            this.serverModel.update(this.serverId, { label: inputValue })
            this.serverModel.saveAll()
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertUpdate () {
    const server = this.serverModel.peek(this.serverId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Update Agent OS to ${server.versionLatest}?`,
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
    const server = this.serverModel.peek(this.serverId)
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.updateAgent(this.serverId, server.versionLatest)
      this.serverModel.update(this.serverId, { status: AppHealthStatus.INSTALLING, statusAt: new Date().toISOString() })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertRestart () {
    const server = this.serverModel.peek(this.serverId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to restart ${server.label}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Restart',
          cssClass: 'alert-danger',
          handler: async () => {
            this.restart()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertShutdown () {
    const server = this.serverModel.peek(this.serverId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Are you sure you want to shut down ${server.label}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Shutdown',
          cssClass: 'alert-danger',
          handler: async () => {
            this.shutdown()
          },
        },
      ],
    })
    await alert.present()
  }

  async presentAlertForget () {
    const server = this.serverModel.peek(this.serverId)
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to forget ${server.label} on this device?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Forget Server',
          cssClass: 'alert-danger',
          handler: async () => {
            this.forget()
          },
        },
      ],
    })
    await alert.present()
  }

  async restart () {
    const server = this.serverModel.peek(this.serverId)
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      message: `Restarting ${server.label}...`,
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.restartServer(this.serverId)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async shutdown () {
    const server = this.serverModel.peek(this.serverId)
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      message: `Shutting down ${server.label}...`,
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.shutdownServer(this.serverId)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async forget () {
    await this.serverModel.remove(this.serverId)
    await this.navCtrl.navigateRoot(['/auth'])
  }
}
