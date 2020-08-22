import { Injectable } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { HmacService } from 'src/app/services/hmac/hmac.service'
import { AppState } from 'src/app/app-state'
import { RegisterResponse } from './http/http.service'

@Injectable({
  providedIn: 'root',
})
export class ProcessResService {
  constructor (
    private readonly hmacService: HmacService,
    private readonly appState: AppState,
    private readonly alertCtrl: AlertController,
  ) { }

  async processRes (productKey: string, data: RegisterResponse): Promise<boolean> {
    const { torAddressSig, claimedAt, certSig, certName, lanAddress } = data

    const torAddress = torAddressSig.message
    const hmacTorRes = await this.hmacService.validateHmac(productKey, torAddressSig.hmac, torAddress, torAddressSig.salt)
    switch (hmacTorRes) {
      case 'hmac-invalid':
        await this.presentAlertInvalidRes('tor address')
        return false
      case 'success': console.log(`Successful hmac validation`)
    }

    const cert = { cert: certSig.message, name: certName }
    // TODO uncomment when ssl is complete on the backend
    const hmacCertRes = await this.hmacService.validateHmac(productKey, certSig.hmac, certSig.message, certSig.salt)
    switch (hmacCertRes) {
      case 'hmac-invalid':
        await this.presentAlertInvalidRes('ssl cert')
        return false
      case 'success': console.log(`Successful hmac validation`)
    }

    await this.appState.addDevice(new Date(claimedAt), productKey, torAddress, lanAddress, cert)
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