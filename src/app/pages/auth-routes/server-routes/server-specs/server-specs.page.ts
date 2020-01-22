import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerSpecs } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'server-specs',
  templateUrl: './server-specs.page.html',
  styleUrls: ['./server-specs.page.scss'],
})
export class ServerSpecsPage {
  error = ''
  loading = true
  specs: ServerSpecs
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    try {
      this.specs = await this.serverService.getServerSpecs(this.serverId)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  asIsOrder () {
    return 1
  }
}
