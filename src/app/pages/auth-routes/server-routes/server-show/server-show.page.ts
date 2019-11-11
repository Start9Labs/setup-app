import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { updateS9, S9ServerFull } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'

@Component({
  selector: 'page-server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  view: 'apps' | 'about' = 'apps'
  server: S9ServerFull
  edited = false

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
    private readonly clipboardService: ClipboardService,
  ) { }

  ngOnInit () {
    this.fetchServer()
  }

  ionViewWillEnter () {
    this.fetchServer()
  }

  fetchServer () {
    const id = this.route.snapshot.paramMap.get('serverId')
    if (!id) { throw new Error (`Need id in params for manage page but got none.`) }

    const server = this.serverModel.getServer(id) as S9ServerFull
    if (!server) { throw new Error (`Need server in server model for manage page but got none for id ${id}.`) }

    this.server = server
  }

  async ionViewWillLeave () {
    if (this.edited) {
      this.server = updateS9(this.server, { friendlyName: this.server.friendlyName || this.server.id })
      await this.serverModel.saveServer(this.server)
    }
  }

  async copyTor () {
    await this.clipboardService.copy(this.server.torAddress)
  }

  async presentAlertForget () {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: `Are you sure you want to forget ${this.server.friendlyName} on this device?`,
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
