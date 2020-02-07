import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerStatus } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { ActionSheetButton } from '@ionic/core'
import { AppModel, AppInstalled } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Observable, BehaviorSubject } from 'rxjs'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error = ''
  view: 'apps' | 'about' = 'apps'
  loading = true
  compareVersions = compareVersions
  server$: BehaviorSubject<S9Server>
  serverId: string
  serverApps$: Observable<{ [appId: string]: BehaviorSubject<AppInstalled> }>

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
    this.serverApps$ = this.appModel.watchServerCache(this.serverId)

    this.getServerAndApps()
  }

  async doRefresh (event: any) {
    await this.getServerAndApps()
    event.target.complete()
  }

  async getServerAndApps () {
    const server = this.server$.value
    this.loading = true
    try {
      await this.sss.fromCache().syncServer(server)
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async presentAction () {
    const server = this.server$.value
    const buttons: ActionSheetButton[] = [
      {
        text: 'Edit Friendly Name',
        icon: 'pricetag',
        handler: () => {
          this.presentAlertEditName()
        },
      },
    ]

    if (server.status === ServerStatus.RUNNING) {
      buttons.push(
        {
          text: 'Server Specs',
          icon: 'information-circle-outline',
          handler: () => {
            this.navCtrl.navigateForward(['specs'], { relativeTo: this.route })
          },
        },
        {
          text: 'Metrics',
          icon: 'pulse',
          handler: () => {
            this.navCtrl.navigateForward(['metrics'], { relativeTo: this.route })
          },
        },
        {
          text: 'Wifi',
          icon: 'wifi',
          handler: () => {
            this.navCtrl.navigateForward(['wifi'], { relativeTo: this.route })
          },
        },
        {
          text: 'Developer Options',
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
    const server = this.server$.value
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
            this.serverModel.updateCache(this.serverId, { label: inputValue })
            this.serverModel.saveAll()
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertUpdate () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Update MeshOS to ${server.versionLatest}?`,
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
    const server = this.server$.value
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.updateAgent(this.serverId, server.versionLatest)
      this.serverModel.updateCache(this.serverId, { status: ServerStatus.UPDATING, statusAt: new Date().toISOString() })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertRestart () {
    const server = this.server$.value
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
    const server = this.server$.value
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
    const server = this.server$.value
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to forget ${server.label} on this device? You can add it back later. The server itself will not be affected.`,
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
    const server = this.server$.value
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
    const server = this.server$.value
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
    await this.serverModel.removeFromCache(this.serverId)
    await this.serverModel.saveAll()
    await this.navCtrl.navigateRoot(['/auth'])
  }
}
