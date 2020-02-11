import { Component } from '@angular/core'
import { ServerModel, S9Server, ObservableWithId } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: ObservableWithId<S9Server>[]
  addServersSubscription: Subscription
  deleteServersSubscription: Subscription

  constructor (
    public serverModel: ServerModel,
    private readonly sss: ServerSyncService,
    private readonly navCtrl: NavController,    
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAllOfThem()
    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      this.servers.push(...this.serverModel.watchThem(newServers.map(s => s.id)))
    })
    this.deleteServersSubscription = this.serverModel.watchServerDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.servers.findIndex(s => s.id === id)
        this.servers.splice(i, 1)
      })
    })
  }

  async doRefresh (event: any) {
    await this.sss.fromCache().syncServers()
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }
}
