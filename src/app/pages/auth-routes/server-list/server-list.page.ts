import { Component } from '@angular/core'
import { ServerModel, S9Server, ObservableWithId } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Subscription } from 'rxjs'
import { first } from 'rxjs/operators'

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
      const serversToWatch = this.serverModel.watchThem(newServers.map(s => s.id))
      
      //@TODO remove
      serversToWatch[0].observe$.pipe(first()).subscribe(s => console.log(JSON.stringify(s)))
      
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
    await this.sss.fromCache().syncServers()
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }

  ngOnDestroy(){
    this.addServersSubscription.unsubscribe()
    this.deleteServersSubscription.unsubscribe()
  }
}
