import { Component } from '@angular/core'
import { S9ServerModel } from 'src/app/models/server-model'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  constructor (
    public dataService: S9ServerModel,
  ) { }
}
