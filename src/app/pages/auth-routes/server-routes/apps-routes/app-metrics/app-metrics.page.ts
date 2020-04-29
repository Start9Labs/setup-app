import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AppMetrics } from 'src/app/models/server-model'
import { ApiService } from 'src/app/services/api.service'
import { pauseFor } from 'src/app/util/misc.util'
import { Observable } from 'rxjs'
import { ServerAppModel } from 'src/app/models/server-app-model'

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
  appTitle$: Observable<string>

  constructor (
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly serverAppModel: ServerAppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string

    this.appTitle$ = this.serverAppModel.get(this.serverId).watchAppProperties(this.appId).title

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
      const metrics = await this.apiService.getAppMetrics(this.serverId, this.appId)
      if (!metrics) return

      Object.keys(metrics).forEach(key => {
        if (typeof metrics[key] !== 'string' && typeof metrics[key] !== 'number') { return }
        this.metrics[key] = metrics[key]
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
