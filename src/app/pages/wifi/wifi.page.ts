import { Component } from '@angular/core'
import { Platform, NavController, LoadingController } from '@ionic/angular'
import { ServerModel } from 'src/app/storage/server-model'
import { APService } from 'src/app/services/ap-service'
import { WifiWizard } from 'src/app/services/wifi-wizard'
import { ActivatedRoute } from '@angular/router'
import { Start9Server } from 'src/types/Start9Server';
import { Subscription } from 'rxjs'

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
  resumeSubscription: Subscription

  constructor (
    public platform: Platform,
    public navController: NavController,
    public dataService: ServerModel,
    public APService: APService,
    public wifiWizard: WifiWizard,
    public loadingCtrl: LoadingController,
    public route: ActivatedRoute,
  ) { }

  async ngOnInit () {
    await this.detectWifi()
    this.loading = false

    this.resumeSubscription = this.platform.resume.subscribe(async () => {
      await this.detectWifi()
    })

    const ssid = this.route.snapshot.paramMap.get('id')
    this.server = this.dataService.getServer(ssid)
  }

  async ngOnDestroy () {
    this.resumeSubscription.unsubscribe()
  }

  async detectWifi (): Promise<void> {
    this.connectedSSID = await this.wifiWizard.getConnectedSSID()
  }

  async connect (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting to server...',
    })
    await loader.present()

    try {
      // AP - connect to server
      await this.wifiWizard.connect(this.server.id, this.server.secret)
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
      await this.APService.submitWifiCredentials({ ssid: this.connectedSSID, password: this.wifiPasswordInput })
        .catch((e) => {
          throw new Error(`Error sending wifi credentials to server: ${e}`)
        })
      // AP - enable wifi on server
      loader.message = 'Enabling wifi on server...'
      await this.APService.enableWifi({ ssid: this.connectedSSID })
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
