import { Injectable } from '@angular/core'
import { S9Server, getLanIP, updateS9_MUT, LanS9Server, isLanEnabled, HandshakeAttempt, isFullySetup } from '../models/s9-server'
import { HttpService, HttpOptions } from './http.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { Method } from 'src/app/types/enums'
import { clone } from '../models/server-model'
import { pauseFor } from 'src/app/util/misc.util'
import { HttpHeaders } from '@angular/common/http'

@Injectable()
export class SetupService {
  private static readonly setupAttempts = 10
  private static readonly waitForMS = 1000
  public message = ''

  constructor (
    private readonly httpService: HttpService,
    private readonly zeroconfDaemon: ZeroconfDaemon,
  ) { }

  async setup (ss: S9Server, serial: string): Promise<S9Server> {
    const pubkey = 'publicknomicon'
    for (let i = 0; i < SetupService.setupAttempts; i ++) {
      const completedServer = await this.setupAttempt(ss, pubkey, serial)
      if (isFullySetup(completedServer)) {
        return completedServer
      }
      await pauseFor(SetupService.waitForMS)
    }

    throw new Error(`failed ${this.message}`)
  }

  private async setupAttempt (ss: S9Server, pubkey: string, serial: string): Promise<S9Server> {
    const ssClone = clone(ss)

    // enable lan
    if (!isLanEnabled(ssClone)) {
      this.message = `getting zeroconf service`
      updateS9_MUT(ssClone, { zeroconfService: this.zeroconfDaemon.getService(ssClone)})
    }

    // pubkey registration
    if (isLanEnabled(ssClone) && !ss.registered) {
      this.message = `registering pubkey`
      updateS9_MUT(ssClone, { registered: await this.registerPubkey(ssClone, pubkey, serial) }) // true or false
    }

    // lan handshake
    if (isLanEnabled(ssClone) && ss.registered && !ss.lastHandshake.success) {
      this.message = `executing server handshake`
      updateS9_MUT(ssClone, { lastHandshake: await this.handshake(ssClone) })
    }

    // tor acquisition
    if (isLanEnabled(ssClone) && ss.registered && ss.lastHandshake.success && !ss.torAddress) {
      this.message = `getting tor address`
      const { torAddress } = await this.httpService.request<{ torAddress: string }>(Method.get, getLanIP(ss) + '/tor')
      updateS9_MUT(ssClone, { torAddress })
    }

    return ssClone
  }

  async registerPubkey (ss: LanS9Server, pubkey: string, serial: string): Promise<boolean> {
    try {
      const headers: HttpHeaders = new HttpHeaders({ 'timeout': '3000' })
      await this.httpService.request(Method.post, getLanIP(ss) + '/register', { headers }, { pubkey, serial })
      return true
    } catch (e) {
      console.error(`failed pubkey registration for ${ss.id}: ${e.message}`)
      return false
    }
  }

  async handshake (ss: LanS9Server, timeoutMs?: number) : Promise<HandshakeAttempt> {
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