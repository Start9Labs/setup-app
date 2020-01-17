import { Component } from '@angular/core'
import { ServerModel } from 'src/app/models/server-model'
import { ServerDaemon } from 'src/app/daemons/server-daemon'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {

  constructor (
    public serverModel: ServerModel,
    public serverDaemon: ServerDaemon,
    private readonly navCtrl: NavController,
  ) { }

  async doRefresh (event: any) {
    await this.serverDaemon.syncServers()
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }
}
