import { Component, NgZone } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { ServerModel } from 'src/app/models/server-model'
import { idFromSerial } from 'src/app/models/server-model'
import { SetupService, fromUserInput } from 'src/app/services/setup.service'
import { ZeroconfMonitor } from 'src/app/services/zeroconf.service'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  error = ''
  label = ''
  productKey = ''
  existsSub: Subscription
  serviceExists = false

  constructor (
    private readonly navController: NavController,
    private readonly setupService: SetupService,
    private readonly serverModel: ServerModel,
    private readonly syncService: SyncService,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    this.existsSub = this.zeroconfMonitor.watchServiceExists().subscribe(e => {
      this.zone.run(() => { this.serviceExists = e })
    })
  }

  ngOnDestroy () {
    this.existsSub.unsubscribe()
  }

  async submit (): Promise<void> {
    const id = idFromSerial(this.productKey)
    const serverData = fromUserInput(id, this.label)

    const loader = await this.loadingCtrl.create({
      message: 'Claiming Embassy. This could take a while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    // attempt to acquire all connection info for new server + check status asynchronously
    try {
      const server = await this.setupService.setup(serverData, this.productKey)
      this.serverModel.createServer(server)
      await this.serverModel.saveAll()
      this.syncService.sync(server.id)
      await this.navController.navigateRoot(['/auth'])
    } catch (e) {
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }
}

