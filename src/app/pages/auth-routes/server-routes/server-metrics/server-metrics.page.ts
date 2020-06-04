import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerMetrics } from 'src/app/models/server-model'
import { ApiService } from 'src/app/services/api.service'
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
    private readonly apiService: ApiService,
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
      await pauseFor(250)
      await this.getMetrics()
    }
  }

  stopDaemon () {
    this.going = false
  }

  async getMetrics (): Promise<void> {
    try {
      const metrics = await this.apiService.getServerMetrics(this.serverId)
      Object.keys(metrics).forEach(outerKey => {
        if (!this.metrics[outerKey]) {
          this.metrics[outerKey] = metrics[outerKey]
        } else {
          Object.entries(metrics[outerKey]).forEach(([key, value]) => {
            this.metrics[outerKey][key] = value
          })
        }
      })
    } catch (e) {
      console.error(e)
      this.error = e.message
      this.stopDaemon()
    }
  }

  asIsOrder (a: any, b: any) {
    return 1
  }
}
