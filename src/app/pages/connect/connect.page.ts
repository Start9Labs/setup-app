import { Component } from '@angular/core'
import { LoadingController, NavController, AlertController, isPlatform, getPlatforms } from '@ionic/angular'
import { getLanIP, RpcService, idFromProductKey, RegisterResponse } from '../../services/rpc.service'
import { decryptTorAddress, encryptTorKey, generateTorKey } from 'src/app/util/crypto.util'
import { ZeroconfMonitor } from 'src/app/services/zeroconf/zeroconf.service'
import { Store } from 'src/app/services/store.service'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'connect',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss'],
})
export class ConnectPage {
  isWebAndroid = false
  productKey = ''
  ip = ''
  url = ''
  error = ''

  constructor (
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly rpcService: RpcService,
    private readonly alertCtrl: AlertController,
    private readonly store: Store,
  ) { }

  ngOnInit () {
    console.log(getPlatforms())
    this.isWebAndroid = isPlatform('android') && !isPlatform('capacitor')
  }

  handleInput (): void {
    // @TODO validate product key
    this.error = ''
  }

  async submit (): Promise<void> {
    this.error = ''

    try {
      // @TODO validate product key

      let host = this.ip
      if (!host) {
        host = isPlatform('capacitor') ? this.getIP() : this.getLanAddress()
      }
      this.url = `http://${host}:5959`
    } catch (e) {
      this.error = e.message
      return
    }

    const loader = await this.loadingCtrl.create({
      message: 'Connecting to Embassy...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.echo()
      loader.message = 'Transferring private key'
      const { torAddress, claimed } = await this.register()
      loader.message = 'Verifying Tor address...'
      this.store.torAddress = await this.verify(torAddress)
      this.store.claimed = claimed
      this.navCtrl.navigateForward(['/complete'])
      this.reset()
    } catch (e) {
      this.presentAlertError(e.header || 'Error', e.message)
    } finally {
      loader.dismiss()
    }
  }

  async presentPromptIp (): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Embassy IP Address',
      message: 'In your router settings, find the device named “start9-[ID]”. Take note of the associated IP address and enter it here.',
      inputs: [
        {
          name: 'ip',
          type: 'tel',
          placeholder: 'IP Address: ex 192.168.0.1',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Ok',
          handler: ({ ip }) => {
            this.ip = ip
          },
        },
      ],
    })

    return alert.present()
  }

  private async echo (): Promise<void> {
    await pauseFor(1000)
    try {
      await Promise.all([
        this.rpcService.rpcRequest<RegisterResponse>({
          method: 'POST',
          url: this.url,
          data: {
            method: 'server.echo',
            params: { },
          },
        }),
        pauseFor(1000),
      ])
    } catch (e) {
      const message = 'Please make sure you are connected to the same network as your Embassy, check the product key, and try again.'
      throw new SetupError('Not Found', message)
    }
  }

  private async register (): Promise<RegisterResponse> {
    await pauseFor(1000)
    try {
      const torKey = await generateTorKey()
      const { cipher, counter, salt } = await encryptTorKey(torKey, this.productKey)
      const encodedPrivKey = counter + salt + cipher
      // const encodedPrivKey = base32.encode(counter + salt + cipher)

      const [torAddr] = await Promise.all([
        this.rpcService.rpcRequest<RegisterResponse>({
          method: 'POST',
          url: this.url,
          data: {
            method: 'server.register',
            params: { privKey: encodedPrivKey },
          },
        }),
        pauseFor(1000),
      ])
      return torAddr
    } catch (e) {
      throw new SetupError('Registration Error', e.message)
    }
  }

  private async verify (encryptedTorAddre: string): Promise<string> {
    await pauseFor(2000)
    try {
      return decryptTorAddress(encryptedTorAddre, this.productKey)
    } catch (e) {
      const header = 'Address Verification Failed'
      const message = `Unable to decrypt Tor address. ${e.message}. Please contact support at support@start9labs.com.`
      throw new SetupError(header, message)
    }
  }

  private getIP (): string {
    // get zeroconf service
    const zeroconfService = this.zeroconfMonitor.getService(this.productKey)
    if (!zeroconfService) { throw new Error('Embassy not found on local network. Please check the Product Key and ensure your phone is connected to WiFi.') }

    // get IP
    const ip = getLanIP(zeroconfService)
    if (!ip) { throw new Error('IP address not found. Please contact support.') }

    return ip
  }

  private getLanAddress (): string {
    const id = idFromProductKey(this.productKey)
    return `start9-${id}.local`
  }

  private async presentAlertError (header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'alert-error',
    })

    return alert.present()
  }

  private reset (): void {
    this.productKey = ''
    this.ip = ''
    this.error = ''
  }
}

function SetupError (header: string, message: string): void {
  this.header = header
  this.message = message
}
