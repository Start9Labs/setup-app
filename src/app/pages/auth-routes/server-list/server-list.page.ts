import { Component, NgZone } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: S9Server[]
  private deltaSubscription: Subscription

  constructor (
    public serverModel: ServerModel,
    public sss: ServerSyncService,
    private readonly navCtrl: NavController,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.peekAll()
    this.deltaSubscription = this.serverModel.serverDelta$.subscribe(a => {
      if (a) {
        this.zone.run(() => {
          this.servers = this.serverModel.peekAll()
        })
      }
    })
  }

  ngOnDestroy () {
    this.deltaSubscription.unsubscribe()
  }

  async doRefresh (event: any) {
    await this.sss.fromCache().syncServers()
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }
}
