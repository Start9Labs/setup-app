import { Component } from '@angular/core'
import { ApiService } from 'src/app/services/api.service'
import { AppAvailablePreview } from 'src/app/models/app-model'
import { ActivatedRoute } from '@angular/router'
import { pauseFor, getIcon } from 'src/app/util/misc.util'
import * as compareVersions from 'compare-versions'

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
  compareVersions = compareVersions
  getIcon = getIcon

  constructor (
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
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
      this.apps = await this.apiService.getAvailableApps(this.serverId)
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      this.loading = false
    }
  }
}
