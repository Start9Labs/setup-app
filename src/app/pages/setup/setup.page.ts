import { Component, OnInit } from '@angular/core'
import { Platform, LoadingController, NavController } from '@ionic/angular'
import { APService } from 'src/app/services/ap-service'
import { LANService } from 'src/app/services/lan-service'
import { WifiWizard } from 'src/app/services/wifi-wizard'
import * as CryptoJS from 'crypto-js'
import { DataService } from 'src/app/services/data-service'

@Component({
  selector: 'page-setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage implements OnInit {
  public loading = true
  public error = ''
  public connectedSSID: string | undefined
  public friendlyName = ''
  public wifiPasswordInput = ''
  public serverPasscodeInput = ''

  constructor (
    public platform: Platform,
    public navController: NavController,
    public dataService: DataService,
    public APService: APService,
    public LANService: LANService,
    public wifiWizard: WifiWizard,
    public loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    await this.detectWifi()
    this.loading = false

    this.platform.resume.subscribe(async () => {
      await this.detectWifi()
    })
  }

  async detectWifi (): Promise<void> {
    this.connectedSSID = await this.wifiWizard.getConnectedSSID()
  }

  async connect (): Promise<void> {
    const first4 = CryptoJS.SHA256(this.serverPasscodeInput).toString().substr(0, 4)
    const serverSID = `start9-${first4}`

    const loader = await this.loadingCtrl.create({
      message: 'Connecting to server...',
    })
    await loader.present()

    try {
      // AP - connect to server
      await this.wifiWizard.connect(serverSID, this.serverPasscodeInput)
        .catch((e) => {
          throw new Error(`Error connecting to server: ${e} Please make sure your server is in setup mode.`)
        })
      // AP - get Tor address
      loader.message = 'Getting Tor address...'
      const torAddress = await this.APService.getTorAddress()
      .catch((e) => {
        throw new Error(`Error getting Tor address: ${e}`)
      })
      // AP - send wifi creds to server
      loader.message = 'Sending wifi credentials to server...'
      await this.APService.submitWifiCredentials(this.connectedSSID, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error sending wifi credentials to server: ${e}`)
        })
      // AP - enable wifi on server
      loader.message = 'Enabling wifi on server...'
      await this.APService.enableWifi(this.connectedSSID)
        .catch((e) => {
          throw new Error(`Error enabling wifi on server: ${e}`)
        })
      // reconnect to wifi
      loader.message = 'Reconnecting to wifi...'
      await this.wifiWizard.connect(this.connectedSSID, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error connecting to wifi: ${e}`)
        })
      // save server
      this.dataService.saveServer({
        secret: this.serverPasscodeInput,
        SID: serverSID,
        zeroconfHostname: `${serverSID}.local`,
        friendlyName: this.friendlyName || serverSID,
        torAddress,
      })
      await this.navController.navigateRoot(['/dashboard'])
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

