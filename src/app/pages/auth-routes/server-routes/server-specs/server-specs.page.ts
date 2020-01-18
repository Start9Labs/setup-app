import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerSpecs } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'server-specs',
  templateUrl: './server-specs.page.html',
  styleUrls: ['./server-specs.page.scss'],
})
export class ServerSpecsPage {
  error = ''
  loading = true
  server: S9Server
  specs: ServerSpecs

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

    try {
      this.specs = await this.serverService.getServerSpecs(this.server)
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
