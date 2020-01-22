import { Component } from '@angular/core'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { Observable } from 'rxjs'

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

