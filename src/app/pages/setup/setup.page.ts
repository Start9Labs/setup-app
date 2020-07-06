import { Component, NgZone } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { ZeroconfMonitor } from '../../services/zeroconf.service'
import { HttpService, getLanIP, idFromProductKey, Method } from '../../services/http.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'page-connect',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss'],
})
export class ConnectPage {
  error = ''
  torAddress = ''

  constructor (
    private readonly navController: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly httpService: HttpService,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    this.torAddress = 'hellotor.onion'
  }

  async setup (ip?: string): Promise<void> {
    const loader = await this.loadingCtrl.create({
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    this.error = ''

    try {
      await this.httpService.request({
        method: Method.POST,
        url: `http://${ip}:5959/setup`,
        data: { privateKey: '' },
      })
      await this.navController.navigateRoot(['/devices'])
    } catch (e) {
      console.error(e)
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }
}
