import { Component } from '@angular/core'
import { S9ServerModel } from 'src/app/storage/server-model'

@Component({
  selector: 'page-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  constructor (
    public dataService: S9ServerModel,
  ) { }
}
