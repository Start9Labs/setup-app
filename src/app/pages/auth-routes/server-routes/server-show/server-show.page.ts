import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { S9Server, updateS9 } from 'src/app/models/s9-server'
import { ClipboardService } from 'src/app/services/clipboard.service'

@Component({
  selector: 'page-server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  view: 'apps' | 'about' = 'apps'
  server: S9Server
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

    const server = this.serverModel.getServer(id)
    if (!server) { throw new Error (`Need server in server model for manage page but got none for id ${id}.`) }

    this.server = server
  }

  async ionViewWillLeave () {
    if (this.edited) {
      this.server = updateS9(this.server, { friendlyName: this.server.friendlyName || this.server.id })
      await this.serverModel.saveServer(this.server)
    }
  }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Caution',
      message: 'Are you sure you want to remove this server?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove Server',
          cssClass: 'alert-danger',
          handler: async () => {
            this.remove()
          },
        },
      ],
    })
    await alert.present()
  }

  async remove () {
    this.edited = false
    await this.serverModel.removeServer(this.server.id)
    await this.navCtrl.navigateRoot(['/servers'])
  }
}
