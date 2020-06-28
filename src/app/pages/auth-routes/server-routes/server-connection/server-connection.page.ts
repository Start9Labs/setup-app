import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PropertySubject } from 'src/app/util/property-subject.util'
import { S9Server, ServerModel, ConnectionPreference } from 'src/app/models/server-model'
import { NavController } from '@ionic/angular'

@Component({
  selector: 'server-connection',
  templateUrl: 'server-connection.page.html',
  styleUrls: ['server-connection.page.scss'],
})
export class ServerConnectionPage {
  serverId: string
  server: PropertySubject<S9Server>
  connectionPreference: ConnectionPreference
  ConnectionPreference = ConnectionPreference
  staticIP: string
  error = ''

  constructor (
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly serverModel: ServerModel,
  ) {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server = this.serverModel.watch(this.serverId)
    this.connectionPreference = this.server.connectionPreference.getValue()
    this.staticIP = this.server.staticIP.getValue()
  }

  async save (): Promise<void> {
    this.serverModel.updateServer(this.serverId, {
      connectionPreference: this.connectionPreference,
      staticIP: this.staticIP,
    })
    this.serverModel.saveAll()
    this.navCtrl.back()
  }
}
