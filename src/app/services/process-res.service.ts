import { Injectable } from '@angular/core'
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
  ) { }

  async processRes (productKey: string, data: RegisterResponse): Promise<ProcessResResult> {
    const { torAddressSig, claimedAt, certSig, certName, lanAddress } = data

    const torAddress = torAddressSig.message
    if (!await this.hmacService.validateHmac(productKey, torAddressSig.hmac, torAddress, torAddressSig.salt)) {
      return ProcessResResult.InvalidTorAddress
    }

    const cert = { cert: certSig.message, name: certName }
    if (!await this.hmacService.validateHmac(productKey, certSig.hmac, certSig.message, certSig.salt)) {
      return ProcessResResult.InvalidSslCert
    }

    await this.store.addDevice(new Date(claimedAt), productKey, torAddress, lanAddress, cert)
    return ProcessResResult.AllGood
  }
}

export enum ProcessResResult {
  InvalidTorAddress,
  InvalidSslCert,
  AllGood,
}