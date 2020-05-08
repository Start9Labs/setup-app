import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerSpecs } from 'src/app/models/server-model'
import { ApiService } from 'src/app/services/api.service'
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

  constructor (
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly toastCtrl: ToastController,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    try {
      const [specs] = await Promise.all([
        this.apiService.getServerSpecs(this.serverId),
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
    console.log(this.specs)
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
