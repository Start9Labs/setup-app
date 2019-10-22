import { Component, OnInit } from '@angular/core'
import { Platform, LoadingController } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { HttpService } from 'src/app/services/http-service'
import * as CryptoJS from 'crypto-js'

declare var WifiWizard2: any

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly start9WifiPrefix: string = 'start9'
  public loading = true
  public error = ''
  public torAddress: string | undefined
  public connectedSSID: string | undefined
  public start9PasswordInput = ''
  public wifiNameInput = ''
  public wifiPasswordInput = ''

  constructor (
    private readonly storage: Storage,
    private readonly platform: Platform,
    private readonly httpService: HttpService,
    private loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    this.torAddress = await this.storage.get('torAddress')

    await this.searchWifi()

    this.platform.resume.subscribe( async () => {
      await this.searchWifi()
    })
  }

  async submitStart9Password () {
    const first4 = CryptoJS.SHA256(this.start9PasswordInput).toString().substr(0, 8)
    const accessPoint = `${this.start9WifiPrefix}-${first4}`
    const loader = await this.loadingCtrl.create({
      message: `Connecting to ${accessPoint}...`,
    })
    await loader.present()
    if (this.platform.is('cordova')) {
      try {
        if (this.platform.is('ios')) {
          await WifiWizard2.iOSConnectNetwork(accessPoint, this.start9PasswordInput)
        } else {
          await WifiWizard2.connect(accessPoint, true, this.start9PasswordInput, 'WPA', true)
        }
        this.connectedSSID = await WifiWizard2.getConnectedSSID()
      } catch (e) {
        this.error = e.message
      }
    } else {
      this.connectedSSID = accessPoint
    }
    await loader.dismiss()
  }

  async submitWifiCredentials () {
    try {
      await this.httpService.submitWifiCredentials(this.wifiNameInput, this.wifiPasswordInput)
    } catch (e) {
      this.error = e.message
      return
    }

    try {
      const { torAddress } = await this.httpService.getTorAddress()
      this.torAddress = torAddress
    } catch (e) {
      this.error = e.message
    }
  }

  async searchWifi () {
    this.loading = true
    this.connectedSSID = this.platform.is('cordova') ? await WifiWizard2.getConnectedSSID() : 'start-BrowserDetected'
    if (this.connectedSSID.startsWith(this.start9WifiPrefix)) {
      this.wifiNameInput = this.wifiNameInput || await this.storage.get('lastConnectedSSID')
    } else {
      await this.storage.set('lastConnectedSSID', this.connectedSSID)
    }
    this.loading = false
  }
}

