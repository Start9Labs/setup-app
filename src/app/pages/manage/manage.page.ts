import { Component } from '@angular/core'
import { Start9Server } from 'src/types/misc'
import { ActivatedRoute } from '@angular/router'
import { DataService } from 'src/app/services/data-service'
import { NavController, AlertController } from '@ionic/angular'
import { getServerName } from 'src/types/misc'

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
    public dataService: DataService,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    const ssid = this.route.snapshot.paramMap.get('ssid')
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
            await this.dataService.forgetServer(this.server.ssid)
            await this.navCtrl.navigateRoot(['/dashboard'])
          },
        },
      ],
    })

    await alert.present()
  }
}
