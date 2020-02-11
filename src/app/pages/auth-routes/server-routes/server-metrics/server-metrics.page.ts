import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerMetrics } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'server-metrics',
  templateUrl: './server-metrics.page.html',
  styleUrls: ['./server-metrics.page.scss'],
})
export class ServerMetricsPage {
  error = ''
  loading = true
  going = false
  serverId: string
  metrics: ServerMetrics = { }

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

    this.startDaemon()
  }

  ngOnDestroy () {
    this.stopDaemon()
  }

  async startDaemon (): Promise<void> {
    this.going = true
    while (this.going) {
      await this.getMetrics()
    }
  }

  stopDaemon () {
    this.going = false
  }

  async getMetrics (): Promise<void> {
    try {
      const metrics = await this.serverService.getServerMetrics(this.serverId)
      Object.keys(metrics).forEach(outerKey => {
        Object.entries(metrics[outerKey]).forEach(([key, value]) => {
          this.metrics[outerKey][key] = value
        })
      })
    } catch (e) {
      this.error = e.message
      this.stopDaemon()
    }
  }

  asIsOrder () {
    return 1
  }
}
