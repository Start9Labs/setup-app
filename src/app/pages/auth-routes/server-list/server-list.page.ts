import { Component } from '@angular/core'
import { ServerModel } from 'src/app/models/server-model'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {

  constructor (
    readonly serverModel: ServerModel,
  ) { }

}
