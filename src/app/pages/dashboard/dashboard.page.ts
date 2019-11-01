import { Component } from '@angular/core'
import { ServerModel } from 'src/app/storage/server-model'
import { getServerName } from 'src/types/Start9Server';

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  getServerName = getServerName

  constructor (
    public dataService: ServerModel,
  ) { }

}
