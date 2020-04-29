import { Component } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'
import { PropertyObservableWithId } from 'src/app/util/property-subject.util'
import { TorService } from 'src/app/services/tor.service'
import { animate, style, transition, trigger } from '@angular/animations'

const torAnimation = trigger(
  'torChange',
  [
    transition(
      ':enter',
      [
        style({ transform: 'translateY(-100%)' }),
        animate('.2s ease-in', style({ transform: 'translateY(0%)' })),
      ],
    ),
    transition(
      ':leave',
      [
        animate('.2s ease-out', style({ transform: 'translateY(-100%)' })),
      ],
    ),
  ],
)

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
  animations: [torAnimation],
})
export class ServerListPage {
  servers: PropertyObservableWithId<S9Server>[] = []

  addServersSubscription: Subscription
  deleteServersSubscription: Subscription

  constructor (
    public serverModel: ServerModel,
    public torService: TorService,
    private readonly sss: ServerSyncService,
    private readonly navCtrl: NavController,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAll()

    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      console.log(`new servers inbound...`, newServers)
      this.servers.push(...newServers)
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

  ngOnDestroy () {
    this.addServersSubscription.unsubscribe()
    this.deleteServersSubscription.unsubscribe()
  }
}
