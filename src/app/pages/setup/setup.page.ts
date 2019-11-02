import { Component, OnInit } from '@angular/core'
import { Platform, NavController } from '@ionic/angular'
import { ServerModel } from 'src/app/storage/server-model'
import { identifiersFromSecret } from 'src/types/Start9Server'
import { HandshakeDaemon } from 'src/app/services/handshake-service'

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
    public platform: Platform,
    public navController: NavController,
    public dataService: ServerModel,
    public handshakeDaemon: HandshakeDaemon,
  ) { }

  async submit (): Promise<void> {
    const identifiers = identifiersFromSecret(this.serverPasscodeInput)

    this.dataService.saveServer({
      ...identifiers,
      friendlyName: this.friendlyName,
    })

    await this.handshakeDaemon.reset()

    this.navController.navigateRoot(['/dashboard'])
  }
}

