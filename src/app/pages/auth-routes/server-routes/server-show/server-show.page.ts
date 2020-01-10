import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/s9-server'
import { ActionSheetButton } from '@ionic/core'
import { AppHealthStatus } from 'src/app/models/s9-app'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error: string
  view: 'apps' | 'about' = 'apps'
  server: S9Server
  edited = false
  compareVersions = compareVersions

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
  ) { }

  ngOnInit () {
    const id = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(id)
    if (!server) throw new Error (`No server found with ID: ${id}`)
    this.server = server
  }

  async presentAction () {
    const buttons: ActionSheetButton[] = [
      {
        text: 'Edit friendly name',
        icon: 'pricetag',
        handler: () => {
          this.presentAlertEditName()
        },
      },
    ]

    if (this.server.status === AppHealthStatus.RUNNING) {
      buttons.push(
        {
          text: 'Server info',
          icon: 'information-circle',
          handler: () => {
            this.navCtrl.navigateForward(['/servers', this.server.id, 'specs'])
          },
        },
        {
          text: 'Developer options',
          icon: 'code',
          handler: () => {
            this.navCtrl.navigateForward(['/servers', this.server.id, 'developer-options'])
          },
        },
      )
    }

    buttons.push(
      {
        text: 'Forget Server',
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
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Label',
      inputs: [
        {
          name: 'inputValue',
          type: 'text',
          value: this.server.label,
          placeholder: this.server.id,
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
            if (this.server.label === inputValue) { return }
            // set new value and mark edited
            this.server = { ...this.server, label: inputValue || this.server.id }
            this.serverModel.updateServer(this.server)
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async presentAlertUpdate () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Confirm',
      message: `Update Agent OS to ${this.server.versionLatest}?`,
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
      this.serverModel.updateServer({ ...this.server, status: AppHealthStatus.DOWNLOADING })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Caution',
      message: `Are you sure you want to forget ${this.server.label} on this device?`,
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

  async forget () {
    this.edited = false
    await this.serverModel.forgetServer(this.server.id)
    await this.navCtrl.navigateRoot(['/servers'])
  }
}
