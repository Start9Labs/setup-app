import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerSpecs } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { ClipboardService } from 'src/app/services/clipboard.service'
import { ZeroconfDaemon } from 'src/app/daemons/zeroconf-daemon'

@Component({
  selector: 'server-specs',
  templateUrl: './server-specs.page.html',
  styleUrls: ['./server-specs.page.scss'],
})
export class ServerSpecsPage {
  error = ''
  loading = true
  specs: ServerSpecs
  serverId: string
  lanIP: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
    private readonly clipboardService: ClipboardService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    try {
      const zeroconf = this.zeroconfDaemon.getService(this.serverId)
      if (zeroconf) {
        this.lanIP = zeroconf.ipv4Addresses[0]
      }
      this.specs = await this.serverService.getServerSpecs(this.serverId)
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async copyTor () {
    await this.clipboardService.copy(this.specs['torAddress'] as string || '')
  }

  asIsOrder () {
    return 1
  }
}
