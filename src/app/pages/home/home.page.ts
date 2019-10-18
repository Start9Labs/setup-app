import { Component, OnInit } from '@angular/core'
import { Events, Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { HttpService } from 'src/app/services/http-service'

declare var WifiWizard2: any

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly start9WifiPrefix: string = 'start9-'
  public error: string | undefined
  public loading: boolean = true
  public torAddress: string | undefined
  public wifiSSID: string | undefined
  public SSIDInput: string | undefined
  public passwordInput: string | undefined

  constructor (
    private readonly storage: Storage,
    private readonly platform: Platform,
    private readonly httpService: HttpService,
  ) { }

  async ngOnInit () {
    this.torAddress = await this.storage.get('torAddress')

    await this.searchWifi()

    this.platform.resume.subscribe( async () => {
      await this.searchWifi()
    })
  }

  async submitWifiCredentials () {
    try {
      await this.httpService.submitWifiCredentials(this.SSIDInput, this.passwordInput)
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
    this.wifiSSID = this.platform.is('cordova') ? await WifiWizard2.getConnectedSSID() : 'start9-BrowserDetected'
    if (this.wifiSSID.startsWith(this.start9WifiPrefix)) {
      this.SSIDInput = this.SSIDInput || await this.storage.get('lastWifiSSID')
    } else {
      await this.storage.set('lastWifiSSID', this.wifiSSID)
    }
    this.loading = false
  }
}

