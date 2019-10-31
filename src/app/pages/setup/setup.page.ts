import { Component, OnInit } from '@angular/core'
import { Platform, NavController } from '@ionic/angular'
import { DataService } from 'src/app/services/data-service'
import { identifiersFromSecret } from 'src/types/misc'

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
    public dataService: DataService,
  ) { }

  async submit (): Promise<void> {
    const identifiers = identifiersFromSecret(this.serverPasscodeInput)

    this.dataService.saveServer({
      ...identifiers,
      friendlyName: this.friendlyName,
    })

    this.navController.navigateRoot(['/dashboard'])
  }
}

