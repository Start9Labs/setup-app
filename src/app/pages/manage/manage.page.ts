import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { S9ServerModel } from 'src/app/storage/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { S9Server } from 'src/app/storage/s9-server'

@Component({
  selector: 'page-manage',
  templateUrl: 'manage.page.html',
  styleUrls: ['manage.page.scss'],
})
export class ManagePage {
  server: S9Server
  edited = false

  constructor (
    public route: ActivatedRoute,
    public dataService: S9ServerModel,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    // TODO: all hell will break loose if this id dne
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) {
      throw new Error (`Need id in params for manage page but got none.`)
    }
    const server = this.dataService.getServer(id as string) as S9Server
    if (!server) {
      throw new Error (`Need server in server model for manage page but got none for id ${id}.`)
    }
    this.server = server
  }

  async ionViewWillLeave () {
    if (this.edited) {
      console.log(this.server)
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
            await this.navCtrl.navigateRoot(['/dashboard'])
          },
        },
      ],
    })

    await alert.present()
  }
}
