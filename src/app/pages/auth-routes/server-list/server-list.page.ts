import { Component } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Subscription } from 'rxjs'
import { PropertyObservableWithId } from 'src/app/util/property-subject.util'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: PropertyObservableWithId<S9Server>[]

  addServersSubscription: Subscription
  deleteServersSubscription: Subscription

  constructor (
    public serverModel: ServerModel,
    private readonly sss: ServerSyncService,
    private readonly navCtrl: NavController,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAll()

    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      console.log('server-list, added servers:', newServers)
      const serversToWatch = this.serverModel.watchThese(newServers.map(s => s.id))
      console.log('servers to watch', serversToWatch)
      this.servers.push(...serversToWatch)
    })

    this.deleteServersSubscription = this.serverModel.watchServerDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.servers.findIndex(s => s.id === id)
        this.servers.splice(i, 1)
      })
    })
  }

  async doRefresh (event: any) {
    await Promise.all([
      this.sss.fromCache().syncServers(),
      pauseFor(600),
    ])
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }

  ngOnDestroy () {
    this.addServersSubscription.unsubscribe()
    this.deleteServersSubscription.unsubscribe()
  }
}
