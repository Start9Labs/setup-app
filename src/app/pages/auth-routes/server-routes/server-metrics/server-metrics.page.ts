import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerMetrics } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { Observable } from 'rxjs'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'server-metrics',
  templateUrl: './server-metrics.page.html',
  styleUrls: ['./server-metrics.page.scss'],
})
export class ServerMetricsPage {
  error = ''
  loading = true
  serverId: string

  metrics: ServerMetrics

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    await Promise.all([
      this.getMetrics(),
      pauseFor(600),
    ])

    this.loading = false
  }

  async doRefresh (event: any) {
    await this.getMetrics()
    event.target.complete()
  }

  async getMetrics () {
    try {
      this.metrics = await this.serverService.getServerMetrics(this.serverId)
      this.error = ''
    } catch (e) {
      this.error = e.message
    }
  }

  asIsOrder () {
    return 1
  }
}
