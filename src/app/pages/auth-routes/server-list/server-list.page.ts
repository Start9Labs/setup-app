import { Component } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Observable, BehaviorSubject } from 'rxjs'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers$: Observable<{ [id: string]: BehaviorSubject<S9Server> }>

  constructor (
    public serverModel: ServerModel,
    private readonly sss: ServerSyncService,
    private readonly navCtrl: NavController,
  ) { }

  ngOnInit () {
    this.servers$ = this.serverModel.watchAll()
  }

  async doRefresh (event: any) {
    await this.sss.fromCache().syncServers()
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }
}
