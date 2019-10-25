import { Component, OnInit } from '@angular/core'
import { Platform, LoadingController } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { APService } from 'src/app/services/ap-service'
import { LANService } from 'src/app/services/lan-service'
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
  public handshake: boolean
  public torAddress: string | undefined
  public connectedSSID: string | undefined
  public start9AccessPoint = ''
  public start9PasswordInput = ''
  public wifiNameInput = ''
  public wifiPasswordInput = ''

  constructor (
    public storage: Storage,
    public platform: Platform,
    public APService: APService,
    public LANService: LANService,
    public loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    await this.startup()

    this.platform.resume.subscribe(async () => {
      await this.startup()
    })
  }

  async startup () {
    const [macAddress, torAddress, handshake] = await Promise.all([
      this.storage.get('macAddress'),
      this.storage.get('torAddress'),
      this.storage.get('handshake'),
    ])
    this.LANService.macAddress = macAddress
    this.torAddress = torAddress
    this.handshake = handshake

    if (!this.LANService.macAddress || !this.torAddress || !this.handshake) {
      await this.searchWifi()
    }
  }

  async searchWifi () {
    this.loading = true
    this.connectedSSID = this.platform.is('cordova') ? await WifiWizard2.getConnectedSSID() : 'browser_detected'
    if (this.connectedSSID) {
      if (this.connectedSSID.startsWith(this.start9WifiPrefix)) {
        this.wifiNameInput = this.wifiNameInput || await this.storage.get('lastConnectedSSID')
      } else {
        await this.storage.set('lastConnectedSSID', this.connectedSSID)
      }
    }
    this.loading = false
  }

  async submitStart9Password () {
    const first4 = CryptoJS.SHA256(this.start9PasswordInput).toString().substr(0, 4)

    const loader = await this.loadingCtrl.create({
      message: `Connecting to server...`,
    })
    await loader.present()

    try {
      // connect to server
      await this.connectToWifi(`${this.start9WifiPrefix}-${first4}`, this.start9PasswordInput)
        .catch((e) => {
          throw new Error(`Error connecting to server: ${e} Please make sure your server is plaugged in and in setup mode.`)
        })
      // register pubkey
      loader.message = 'Registering pubkey with server...'
      await this.APService.registerPubkey('fakePubKey')
        .catch((e) => {
          throw new Error(`Error registering pubkey: ${e}`)
        })
      // fetch server Tor address
      loader.message = 'Getting Tor address from server...'
      await this.APService.getTorAddress()
        .catch((e) => {
          throw new Error(`Error getting Tor address: ${e}`)
        })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async submitWifiCredentials () {
    const loader = await this.loadingCtrl.create({
      message: `Testing wifi credentials...`,
    })
    await loader.present()

    try {
      // connect to wifi
      await this.connectToWifi(this.wifiNameInput, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error testing credentials: ${e}`)
        })
      // reconnect to server
      loader.message = 'Reconnecting to server...'
      await this.connectToWifi(this.start9AccessPoint, this.start9PasswordInput)
        .catch((e) => {
          throw new Error(`Error reconnecting to server: ${e}`)
        })
      // send wifi creds to server
      loader.message = 'Sending wifi credentials to server...'
      await this.APService.submitWifiCredentials(this.wifiNameInput, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error sending wifi credentials to server: ${e}`)
        })
      // enable wifi on server
      loader.message = 'Enabling wifi on server...'
      await this.APService.enableWifi(this.wifiNameInput)
        .catch((e) => {
          throw new Error(`Error enabling wifi on server: ${e}`)
        })
      // reconnect to wifi
      loader.message = 'Reconnecting to wifi...'
      await this.connectToWifi(this.wifiNameInput, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error connecting to wifi: ${e}`)
        })
      // discover server on LAN
      loader.message = 'Discovering server on LAN...'
      await this.LANService.discover()
      // handshake with server on LAN
      loader.message = 'Testing server connectivity...'
      let attempts = 1
      let keepGoing = true
      while (keepGoing) {
        await this.LANService.handshake()
          .then(() => keepGoing = false)
          .catch((e) => {
            if (attempts === 3) {
              throw new Error(`Error testing Tor connection: ${e}`)
            }
          })
      }
      // set handshake = true in storage
      await this.storage.set('handshake', true)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async connectToWifi (SSID: string, password: string) {
    if (this.platform.is('cordova')) {
      if (this.platform.is('ios')) {
        await WifiWizard2.iOSConnectNetwork(SSID, password)
      } else {
        await WifiWizard2.connect(SSID, true, password, 'WPA', true)
      }
      this.connectedSSID = await WifiWizard2.getConnectedSSID()
      this.wifiNameInput = await this.storage.get('lastConnectedSSID')
    } else {
      this.connectedSSID = SSID
      this.wifiNameInput = await this.storage.get('lastConnectedSSID')
    }
  }
}

