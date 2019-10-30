import { Component, OnInit } from '@angular/core'
import { Platform, NavController } from '@ionic/angular'
import * as CryptoJS from 'crypto-js'
import { DataService } from 'src/app/services/data-service'
import { Start9Server } from 'src/types/misc'

@Component({
  selector: 'page-setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  public error = ''
  public friendlyName = ''
  public serverPasscodeInput = ''

  constructor(
    public platform: Platform,
    public navController: NavController,
    public dataService: DataService,
  ) { }

  async submit(): Promise<void> {
    const first4 = CryptoJS.SHA256(this.serverPasscodeInput).toString().substr(0, 4)
    const serverSSID = `start9-${first4}`

    this.dataService.saveServer({
      secret: this.serverPasscodeInput,
      SSID: serverSSID,
      zeroconfHostname: `${serverSSID}.local`,
      friendlyName: this.friendlyName || serverSSID
    })

    this.navController.navigateRoot(['/dashboard'])
  }
}

