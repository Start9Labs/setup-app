import { Component } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { ServerModel } from 'src/app/models/server-model'
import { idFromSerial } from 'src/app/models/server-model'
import { SetupService, fromUserInput } from 'src/app/services/setup.service'

@Component({
  selector: 'setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  error = ''
  label = ''
  productKey = ''

  constructor (
    private readonly navController: NavController,
    private readonly setupService: SetupService,
    private readonly serverModel: ServerModel,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async submit (): Promise<void> {
    const id = idFromSerial(this.productKey)
    const serverData = fromUserInput(id, this.label)

    const loader = await this.loadingCtrl.create({
      message: 'Setting up server. This could take a while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    // attempt to acquire all connection info for new server + check status asynchronously
    try {
      const server = await this.setupService.setup(serverData, this.productKey)
      await this.serverModel.create(server)
      await this.navController.navigateRoot(['/auth'])
    } catch (e) {
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }
}

