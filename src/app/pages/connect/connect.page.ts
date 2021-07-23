import { Component } from '@angular/core'
import { LoadingController, NavController, AlertController, isPlatform } from '@ionic/angular'
import { getLanIP, RpcService, idFromProductKey, RegisterResponse } from '../../services/rpc.service'
import { decryptTorAddress, encryptTorKey, generateTorKey } from 'src/app/util/crypto.util'
import { ZeroconfMonitor } from 'src/app/services/zeroconf/zeroconf.service'
import { Store } from 'src/app/services/store.service'

@Component({
  selector: 'connect',
  templateUrl: 'connect.page.html',
})
export class ConnectPage {
  segmentValue: 'basic' | 'advanced' = 'basic'
  error = ''
  productKey = ''
  ip = ''

  constructor (
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly rpcService: RpcService,
    private readonly alertCtrl: AlertController,
    private readonly store: Store,
  ) { }

  segmentChanged (): void {
    this.error = ''
  }

  handleInput (): void {
    // validate product key
    // validate ip (if present)
    this.error = ''
  }

  async submit (): Promise<void> {
    // validate product key
    // validate ip (if present)

    this.error = ''

    const loader = await this.loadingCtrl.create({
      message: 'Creating Tor private key...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const torKey = await generateTorKey()
      const { cipher, counter, salt } = await encryptTorKey(torKey, this.productKey)
      const encodedPrivKey = counter + salt + cipher
      // const encodedPrivKey = base32.encode(counter + salt + cipher)

      let host = this.ip

      if (!host) {
        host = isPlatform('capacitor') ? this.getIP() : this.getLanAddress()
      }

      const { torAddress, claimed } = await this.rpcService.rpcRequest<RegisterResponse>({
        method: 'POST',
        url: `http://${host}:5959`,
        data: {
          method: 'server.register',
          params: { privKey: encodedPrivKey },
        },
      })

      try {
        this.store.torAddress = await decryptTorAddress(torAddress, this.productKey)
        this.store.claimed = claimed
      } catch (e) {
        await this.presentAlertInvalidRes(e)
        throw e
      }

      this.navCtrl.navigateForward(['/complete'])

    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      loader.dismiss()
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

  private async presentAlertInvalidRes (e: any): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Error!',
      message: `Unable to decrypt Tor address. ${e.message}. Please contact support at support@start9labs.com.`,
      buttons: ['OK'],
    })

    return alert.present()
  }
}
