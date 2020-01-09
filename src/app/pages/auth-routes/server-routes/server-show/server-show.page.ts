import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController } from '@ionic/angular'
import { S9Server } from 'src/app/models/s9-server'
import { ActionSheetButton } from '@ionic/core'
import { AppHealthStatus } from 'src/app/models/s9-app'

@Component({
  selector: 'page-server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error: string
  view: 'apps' | 'about' = 'apps'
  server: S9Server
  edited = false

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    try {
      const id = this.route.snapshot.paramMap.get('serverId') as string
      const server = this.serverModel.getServer(id)
      if (!server) throw new Error (`No server found with ID: ${id}`)
      this.server = server
    } catch (e) {
      this.error = e.message
    }
  }

  async presentAction () {
    const buttons: ActionSheetButton[] = []

    if (this.server.status === AppHealthStatus.RUNNING) {
      buttons.push({
        text: 'View specs',
        handler: () => {
          this.navCtrl.navigateForward(['/servers', this.server.id, 'specs'])
        },
      })
    }

    buttons.push(
      {
        text: 'Edit label',
        handler: () => {
          this.presentAlertEditName()
        },
      },
      {
        text: 'Developer options',
        handler: () => {
          this.navCtrl.navigateForward(['/servers', this.server.id, 'developer-options'])
        },
      },
      {
        text: 'Forget',
        cssClass: 'alert-danger',
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

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
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
