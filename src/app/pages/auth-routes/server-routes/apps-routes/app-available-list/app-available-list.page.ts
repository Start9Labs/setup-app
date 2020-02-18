import { Component } from '@angular/core'
import { ServerService } from 'src/app/services/server.service'
import { AppAvailablePreview } from 'src/app/models/app-model'
import { ActivatedRoute } from '@angular/router'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'app-available-list',
  templateUrl: './app-available-list.page.html',
  styleUrls: ['./app-available-list.page.scss'],
})
export class AppAvailableListPage {
  loading = true
  error = ''
  apps: AppAvailablePreview[] = []
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    await Promise.all([
      this.getApps(),
      pauseFor(600),
    ])
    this.loading = false
  }

  async doRefresh (e: any) {
    await Promise.all([
      this.getApps(),
      pauseFor(600),
    ])
    e.target.complete()
  }

  async getApps (): Promise<void> {
    try {
      this.apps = await this.serverService.getAvailableApps(this.serverId)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }
}
