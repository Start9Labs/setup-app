import { Component } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { S9ServerModel } from 'src/app/storage/server-model'
import { idFromSerial, fromUserInput } from 'src/app/storage/s9-server'
import { SetupService } from 'src/app/services/setup-service'

@Component({
  selector: 'page-setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  public error = ''
  public friendlyName = ''
  public serial = ''

  constructor (
    private readonly navController: NavController,
    private readonly setupService: SetupService,
    private readonly s9Model: S9ServerModel,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async submit (): Promise<void> {
    const id = idFromSerial(this.serial)
    const newServer = fromUserInput(id, this.friendlyName || id)

    const loader = await this.loadingCtrl.create({ message: 'Setting up server...'})
    await loader.present()

    // attempt to acquire all connection info for new server + handshake asynchronously
    try {
      const setupServer = await this.setupService.setup(newServer, this.serial)
      await this.s9Model.saveServer(setupServer)
      await this.navController.navigateRoot(['/dashboard'])
    } catch (e) {
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }
}

