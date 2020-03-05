import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerSpecs } from 'src/app/models/server-model'
import { ServerService } from 'src/app/services/server.service'
import { ZeroconfDaemon } from 'src/app/daemons/zeroconf-daemon'
import { pauseFor } from 'src/app/util/misc.util'
import { Plugins } from '@capacitor/core'
import { ToastController } from '@ionic/angular'

const { Clipboard } = Plugins

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
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly toastCtrl: ToastController,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    try {
      const zeroconf = this.zeroconfDaemon.getService(this.serverId)
      if (zeroconf) {
        this.lanIP = zeroconf.ipv4Addresses[0]
      }

      const [specs] = await Promise.all([
        this.serverService.getServerSpecs(this.serverId),
        pauseFor(600),
      ])
      this.specs = specs
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async copyTor () {
    let message = ''
    await Clipboard.write({ url: this.specs['Tor Address'] as string || '' })
      .then(() => { message = 'copied to clipboard!' })
      .catch(() => { message = 'failed to copy' })

      const toast = await this.toastCtrl.create({
        header: message,
        position: 'bottom',
        duration: 1000,
        cssClass: 'notification-toast',
      })
      await toast.present()
  }

  asIsOrder () {
    return 1
  }
}
