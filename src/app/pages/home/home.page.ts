import { Component, OnInit } from '@angular/core'
import { Platform, LoadingController } from '@ionic/angular'
import { Storage } from '@ionic/storage'
import { APService } from 'src/app/services/ap-service'
import { LANService } from 'src/app/services/lan-service'
import { WifiWizard } from 'src/app/services/wifi-wizard'
import * as CryptoJS from 'crypto-js'

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  private readonly start9WifiPrefix: string = 'start9'
  public loading = true
  public error = ''
  public hostname: string | undefined
  public torAddress: string | undefined
  public handshake: boolean
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
    public wifiWizard: WifiWizard,
    public loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    await this.startup()

    this.platform.resume.subscribe(async () => {
      await this.startup()
    })
  }

  async startup () {
    const [hostname, torAddress, handshake] = await Promise.all([
      this.storage.get('hostname'),
      this.storage.get('torAddress'),
      this.storage.get('handshake'),
    ])
    this.hostname = hostname
    this.torAddress = torAddress
    this.handshake = handshake

    if (!this.hostname || !this.torAddress || !this.handshake) {
      await this.searchWifi()
    }
  }

  async searchWifi () {
    this.loading = true
    this.connectedSSID = await this.wifiWizard.getConnectedSSID()

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
      await this.wifiWizard.connect(`${this.start9WifiPrefix}-${first4}`, this.start9PasswordInput)
        .catch((e) => {
          throw new Error(`Error connecting to server: ${e.message} Please make sure your server is plaugged in and in setup mode.`)
        })
      // register pubkey
      loader.message = 'Registering pubkey with server...'
      await this.APService.registerPubkey('fakePubKey')
        .catch((e) => {
          throw new Error(`Error registering pubkey: ${e}`)
        })
      // fetch server Hostname address
      loader.message = 'Getting Hostname from server...'
      this.hostname = await this.APService.getHostname()
        .catch((e) => {
          throw new Error(`Error getting Hostname: ${e}`)
        })
      // fetch server Tor address
      loader.message = 'Getting Tor address from server...'
      this.torAddress = await this.APService.getTorAddress()
        .catch((e) => {
          throw new Error(`Error getting Tor address: ${e}`)
        })
      // save Hostname and Tor address
      await Promise.all([
        this.storage.set('hostname', this.hostname),
        this.storage.set('torAddress', this.torAddress),
      ])
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
      await this.wifiWizard.connect(this.wifiNameInput, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error testing credentials: ${e}`)
        })
      // reconnect to server
      loader.message = 'Reconnecting to server...'
      await this.wifiWizard.connect(this.start9AccessPoint, this.start9PasswordInput)
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
      await this.wifiWizard.connect(this.wifiNameInput, this.wifiPasswordInput)
        .catch((e) => {
          throw new Error(`Error connecting to wifi: ${e}`)
        })
      // discover server on LAN
      loader.message = 'Discovering server on LAN...'
      await this.LANService.discover(this.hostname)
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
}

