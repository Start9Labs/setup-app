import { Component, NgZone } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'
import { PropertyObservableWithId } from 'src/app/util/property-subject.util'
import { TorService, TorConnection } from 'src/app/services/tor.service'
// import { animate, style, transition, trigger } from '@angular/animations'
import { doForAtLeast } from 'src/app/util/misc.util'

// const torAnimation = trigger(
//   'torChange',
//   [
//     transition(
//       ':enter',
//       [
//         style({ transform: 'translateY(-100%)' }),
//         animate('.2s ease-in', style({ transform: 'translateY(0%)' })),
//       ],
//     ),
//     transition(
//       ':leave',
//       [
//         animate('.2s ease-out', style({ transform: 'translateY(-100%)' })),
//       ],
//     ),
//   ],
// )

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
  // animations: [torAnimation],
})
export class ServerListPage {
  servers: PropertyObservableWithId<S9Server>[] = []
  addServersSubscription: Subscription
  deleteServersSubscription: Subscription
  progressSub: Subscription
  connectionSub: Subscription
  connection: TorConnection
  progress: number

  constructor (
    public serverModel: ServerModel,
    public torService: TorService,
    private readonly syncService: SyncService,
    private readonly navCtrl: NavController,
    private zone: NgZone,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAll()

    this.connectionSub = this.torService.watchConnection().subscribe(c => {
      this.zone.run(() => {
        this.connection = c
      })
    })

    this.progressSub = this.torService.watchProgress().subscribe(p => {
      this.zone.run(() => {
        this.progress = p / 100
      })
    })

    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      this.servers.push(...newServers)
    })

    this.deleteServersSubscription = this.serverModel.watchServerDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.servers.findIndex(s => s.id === id)
        this.servers.splice(i, 1)
      })
    })
  }

  ngOnDestroy () {
    this.connectionSub.unsubscribe()
    this.progressSub.unsubscribe()
    this.addServersSubscription.unsubscribe()
    this.deleteServersSubscription.unsubscribe()
  }

  async doRefresh (event: any) {
    await doForAtLeast([this.syncService.syncAll()], 600)
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }
}
