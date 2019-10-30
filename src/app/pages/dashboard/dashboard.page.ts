import { Component, OnInit } from '@angular/core'
import { DataService } from 'src/app/services/data-service'

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {

  constructor (
    public dataService: DataService,
  ) { }

}
