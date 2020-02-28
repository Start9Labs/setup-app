import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AppMetrics } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { pauseFor } from 'src/app/util/misc.util'
import { AppModel } from 'src/app/models/app-model'
import { Observable } from 'rxjs'

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
    private readonly serverService: ServerService,
    private readonly appModel: AppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.appId = this.route.snapshot.paramMap.get('appId') as string

    this.appTitle$ = this.appModel.watchAppProperties(this.appId).title

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
      Object.keys(metrics).forEach(key => {
        if (typeof metrics[key] !== 'string') { return }
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
