import { Component, OnInit } from '@angular/core'
import { Events, Platform } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { HttpService } from 'src/app/services/node-service'

declare var WifiWizard2: any

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly start9WifiPrefix: string = 'start9-'
  public torAddress: string | undefined
  public error: string | undefined
  public wifiSSIDInput: string | undefined
  public wifiSSID: string | undefined
  public wifiSSIDPassword: string | undefined
  public loading: boolean = true

  constructor (
    private readonly storage: Storage,
    private readonly platform: Platform,
    private readonly service: HttpService,
  ) { }

  async ngOnInit () {
    this.torAddress = await this.storage.get('torAddress')

    await this.searchWifi()

    this.platform.resume.subscribe( async () => {
      await this.searchWifi()
    })
  }

  async submitWifiCredentials (ssid: string, password: string) {
    try {
      await this.service.submitWifiCredentials(ssid, password)
    } catch (e) {
      this.error = e.message
      return
    }

    try {
      const { torAddress } = await this.service.getTorAddress()
      this.torAddress = torAddress
    } catch (e) {
      this.error = e.message
    }
  }

  async searchWifi () {
    this.loading = true
    this.wifiSSID = this.platform.is('cordova') ? await WifiWizard2.getConnectedSSID() : 'start9-1234'
    if (this.wifiSSID.startsWith(this.start9WifiPrefix)) {
      this.wifiSSIDInput = this.wifiSSIDInput || await this.storage.get('lastWifiSSID')
    } else {
      await this.storage.set('lastWifiSSID', this.wifiSSID)
    }
    this.loading = false
  }
}

