import { Component } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { getServerName } from 'src/types/misc'

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  getServerName = getServerName

  constructor (
    public dataService: DataService,
  ) { }

}
