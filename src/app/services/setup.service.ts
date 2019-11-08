import { Injectable } from '@angular/core'
import { S9Server, getLanIP, updateS9_MUT, isLanEnabled, HandshakeAttempt, isFullySetup, hasKeys, S9ServerFull } from '../models/s9-server'
import { HttpService, HttpOptions } from './http.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { Method } from 'src/app/types/enums'
import { clone } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { HttpHeaders } from '@angular/common/http'
import * as crypto from '../util/crypto.util'
import { AuthService } from './auth.service'
import { Lan } from '../types/api-types'

@Injectable()
export class SetupService {
  private static readonly setupAttempts = 10
  private static readonly waitForMS = 1000
  public message = ''

  constructor (
    private readonly httpService: HttpService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly authService: AuthService,
  ) { }

  async setup (ss: S9Server, serial: string): Promise<S9Server> {
    for (let i = 0; i < SetupService.setupAttempts; i ++) {
      const completedServer = await this.setupAttempt(ss, serial)
      if (isFullySetup(completedServer)) {
        return completedServer
      }
      await pauseFor(SetupService.waitForMS)
    }

    throw new Error(`failed ${this.message}`)
  }

  private async setupAttempt (ss: S9Server, serial: string): Promise<S9Server> {
    const ssClone = clone(ss)

    // enable lan
    if (!isLanEnabled(ssClone)) {
      this.message = `getting zeroconf service`
      updateS9_MUT(ssClone, { zeroconfService: this.zeroconfDaemon.getService(ssClone)})
    }

    // tor acquisition
    if (isLanEnabled(ssClone) && !ss.torAddress) {
      this.message = `getting tor address`
      const { torAddress } = await this.httpService.request<{ torAddress: string }>(Method.get, getLanIP(ss) + '/tor')
      updateS9_MUT(ssClone, { torAddress })
    }

    // derive keys
    if (isLanEnabled(ssClone) && ss.torAddress && !hasKeys(ssClone)) {
      this.message = `deriving keys`
      const { privkey, pubkey } = crypto.deriveKeys(this.authService.mnemonic!, ss.torAddress)
      updateS9_MUT(ssClone, { privkey, pubkey })
    }

    // pubkey registration
    if (isLanEnabled(ssClone) && ss.torAddress && hasKeys(ssClone) && !ss.registered) {
      this.message = `registering pubkey`
      updateS9_MUT(ssClone, { registered: await this.registerPubkey(ssClone, serial) }) // true or false
    }

    // lan handshake
    if (isLanEnabled(ssClone) && ss.torAddress && hasKeys(ssClone) && ss.registered && !ss.lastHandshake.success) {
      this.message = `executing server handshake`
      updateS9_MUT(ssClone, { lastHandshake: await this.handshake(ssClone, 3000) })
    }

    return ssClone
  }

  async registerPubkey (ss: S9ServerFull, serial: string): Promise<boolean> {
    const { id, pubkey } = ss
    try {
      const headers: HttpHeaders = new HttpHeaders({ 'timeout': '3000' })
      const body: Lan.PostRegisterReq = { pubkey, serial }
      await this.httpService.request<Lan.PostRegisterRes>(Method.post, getLanIP(ss) + '/register', { headers }, body)
      return true
    } catch (e) {
      console.error(`failed pubkey registration for ${id}: ${e.message}`)
      return false
    }
  }

  async handshake (ss: S9ServerFull, timeoutMs?: number) : Promise<HandshakeAttempt> {
    const now = new Date()
    try {
      let options: HttpOptions = { }
      if (timeoutMs) { options.headers = new HttpHeaders({ 'timeout': timeoutMs.toString() }) }
      await this.httpService.request(Method.post, getLanIP(ss) + '/handshake', options)
      return { success: true, timestamp: now }
    } catch (e) {
      console.error(`failed handhsake for ${ss.id}: ${e.message}`)
      return { success: false, timestamp: now }
    }
  }
}