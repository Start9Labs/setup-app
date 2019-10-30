import { Component } from '@angular/core';
import { Platform, NavController, LoadingController } from '@ionic/angular';
import { DataService } from 'src/app/services/data-service';
import { APService } from 'src/app/services/ap-service'
import { LANService } from 'src/app/services/lan-service'
import { WifiWizard } from 'src/app/services/wifi-wizard';
import { ActivatedRoute } from '@angular/router';
import { Start9Server } from 'src/types/misc';

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.page.html',
  styleUrls: ['./wifi.page.scss'],
})
export class WifiPage {
  loading = true
  error = ''
  connectedSSID: string | undefined
  wifiPasswordInput = ''
  serverPasscodeInput = ''
  server: Start9Server

  constructor(
    public platform: Platform,
    public navController: NavController,
    public dataService: DataService,
    public APService: APService,
    public wifiWizard: WifiWizard,
    public loadingCtrl: LoadingController,
    public route: ActivatedRoute
  ) { }

  async ngOnInit() {
    await this.detectWifi()
    this.loading = false

    this.platform.resume.subscribe(async () => {
      await this.detectWifi()
    })

    const zeroconfHostname = this.route.snapshot.paramMap.get('zeroconfHostname')
    this.server = this.dataService.getServer(zeroconfHostname)
  }

  async ngOnDestroy() {
    this.platform.resume.unsubscribe()
  }

  async detectWifi(): Promise<void> {
    this.connectedSSID = await this.wifiWizard.getConnectedSSID()
  }

  async connect(): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting to server...',
    })
    await loader.present()

    try {
      // AP - connect to server
      await this.wifiWizard.connect(this.server.SSID, this.server.secret)
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

      // save tor address to server
      this.dataService.saveServer({
        ...this.server,
        torAddress,
      })

      this.navController.back()
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}
