import { Component } from '@angular/core'
import { Start9Server } from 'src/types/Start9Server';
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/storage/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { getServerName } from 'src/types/Start9Server';

@Component({
  selector: 'page-manage',
  templateUrl: 'manage.page.html',
  styleUrls: ['manage.page.scss'],
})
export class ManagePage {
  getServerName = getServerName
  server: Start9Server
  edited = false

  constructor (
    public route: ActivatedRoute,
    public dataService: ServerModel,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    const ssid = this.route.snapshot.paramMap.get('id')
    this.server = this.dataService.getServer(ssid)
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
