import { Component } from '@angular/core'
import { NavController } from '@ionic/angular'
import { S9ServerModel } from 'src/app/storage/server-model'
import { idFromSerial, S9Server, fromUserInput } from 'src/app/storage/s9-server'
import { SetupService } from 'src/app/services/setup-service'

@Component({
  selector: 'page-setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  public error = ''
  public friendlyName = ''
  public serverPasscodeInput = ''

  constructor (
    private readonly navController: NavController,
    private readonly setupService: SetupService,
    private readonly s9Model: S9ServerModel,
  ) { }

  async submit (): Promise<void> {
    const id = idFromSerial(this.serverPasscodeInput)
    const newServer = fromUserInput(id, this.friendlyName || id, 'publickey')
    await this.s9Model.saveServer(newServer)

    // attempt to acquire all connection info for new server + handshake asynchronously
    this.setupService.setup(newServer).then(ss => this.s9Model.saveServer(ss))

    this.navController.navigateRoot(['/dashboard'])
  }
}

