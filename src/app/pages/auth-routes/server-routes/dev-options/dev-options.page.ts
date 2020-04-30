import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'dev-options',
  templateUrl: 'dev-options.page.html',
  styleUrls: ['dev-options.page.scss'],
})
export class DevOptionsPage {
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
  ) { }

  ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
  }
}

