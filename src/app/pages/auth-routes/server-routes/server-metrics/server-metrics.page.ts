import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerMetrics } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'server-metrics',
  templateUrl: './server-metrics.page.html',
  styleUrls: ['./server-metrics.page.scss'],
})
export class ServerMetricsPage {
  error = ''
  loading = true
  server: S9Server
  metrics: ServerMetrics

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    await this.getMetrics()
  }

  async doRefresh (event: any) {
    await this.getMetrics()
    event.target.complete()
  }

  async getMetrics () {
    try {
      this.metrics = await this.serverService.getServerMetrics(this.server)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
