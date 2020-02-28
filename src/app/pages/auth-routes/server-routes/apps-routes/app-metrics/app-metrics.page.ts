import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AppMetrics } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'app-metrics',
  templateUrl: './app-metrics.page.html',
  styleUrls: ['./app-metrics.page.scss'],
})
export class AppMetricsPage {
  error = ''
  loading = true
  going = false
  serverId: string
  appId: string
  metrics: AppMetrics = { }

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string

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
      pauseFor(250)
      await this.getMetrics()
    }
  }

  stopDaemon () {
    this.going = false
  }

  async getMetrics (): Promise<void> {
    try {
      const metrics = await this.serverService.getAppMetrics(this.serverId, this.appId)
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
      this.error = e.message
      this.stopDaemon()
    }
  }

  asIsOrder () {
    return 1
  }
}
