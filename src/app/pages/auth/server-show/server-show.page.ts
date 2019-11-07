import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/models/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { S9Server, updateS9 } from 'src/app/models/s9-server'

@Component({
  selector: 'page-server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  server: S9Server
  edited = false

  constructor (
    public route: ActivatedRoute,
    public dataService: S9ServerModel,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) throw new Error (`Need id in params for manage page but got none.`)

    const server = this.dataService.getServer(id)
    if (!server) throw new Error (`Need server in server model for manage page but got none for id ${id}.`)

    this.server = server
  }

  async ionViewWillLeave () {
    if (this.edited) {
      this.server = updateS9(this.server, { friendlyName: this.server.friendlyName || this.server.id })
      await this.dataService.saveServer(this.server)
    }
  }

  async presentAlertRemove () {
    const alert = await this.alertCtrl.create({
      header: 'Confirm!',
      message: 'Are you sure you want to remove this server?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Remove',
          cssClass: 'alert-danger',
          handler: async () => {
            this.edited = false
            await this.dataService.forgetServer(this.server.id)
            await this.navCtrl.navigateRoot(['/servers'])
          },
        },
      ],
    })

    await alert.present()
  }
}
