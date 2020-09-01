import { Injectable } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { HmacService } from 'src/app/services/hmac/hmac.service'
import { Store } from 'src/app/store'
import { RegisterResponse } from './http/http.service'

@Injectable({
  providedIn: 'root',
})
export class ProcessResService {
  constructor (
    private readonly hmacService: HmacService,
    private readonly store: Store,
    private readonly alertCtrl: AlertController,
  ) { }

  async processRes (productKey: string, data: RegisterResponse): Promise<boolean> {
    const { torAddressSig, claimedAt, certSig, certName, lanAddress } = data

    const torAddress = torAddressSig.message
    if (!await this.hmacService.validateHmac(productKey, torAddressSig.hmac, torAddress, torAddressSig.salt)) {
      await this.presentAlertInvalidRes('tor address')
      return false
    }

    const cert = { cert: certSig.message, name: certName }
    if (!await this.hmacService.validateHmac(productKey, certSig.hmac, certSig.message, certSig.salt)) {
      await this.presentAlertInvalidRes('ssl cert')
      return false
    }
    await this.store.addDevice(new Date(claimedAt), productKey, torAddress, lanAddress, cert)

    return true
  }

  private async presentAlertInvalidRes (sigDescription: string) {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: `Unable to verify ${sigDescription} response from Embassy. It is possible you are experiencing a "Man in the Middle" attack, and you should contact support at support@start9labs.com.`,
      buttons: ['OK'],
    })

    return alert.present()
  }
}