import { Component } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { HttpService, Method } from '../../services/http.service'

@Component({
  selector: 'page-setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  error = ''
  torAddress = ''

  constructor (
    private readonly navController: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly httpService: HttpService,
  ) { }

  ngOnInit () {
    this.torAddress = 'hellotor.onion'
  }

  refresh (): void {
    this.torAddress = 'lalalala.onion'
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
