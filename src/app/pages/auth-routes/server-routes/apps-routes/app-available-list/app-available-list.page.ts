import { Component } from '@angular/core'
import { ServerService } from 'src/app/services/server.service'
import { AppAvailablePreview } from 'src/app/models/app-model'
import { ActivatedRoute } from '@angular/router'
import { ServerModel } from 'src/app/models/server-model'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-available-list',
  templateUrl: './app-available-list.page.html',
  styleUrls: ['./app-available-list.page.scss'],
})
export class AppAvailableListPage {
  loading = true
  error: string
  apps: AppAvailablePreview[] = []
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    try {
      this.serverId = this.route.snapshot.paramMap.get('serverId') as string
      this.apps = await this.serverService.getAvailableApps(this.serverId)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }
}
