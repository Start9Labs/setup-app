import { Injectable } from '@angular/core'
import { S9Server, getLanIP, ServerStatus, EmbassyConnection, idFromProductKey, ConnectionPreference } from '../models/server-model'
import { AuthService } from './auth.service'
import { ReqRes } from './api.service'
import { ZeroconfMonitor } from './zeroconf.service'
import { HttpService, getAuthHeader, Method } from './http.service'
import { HttpOptions } from '@start9labs/capacitor-http'
import * as cryptoUtil from '../util/crypto.util'

@Injectable({
  providedIn: 'root',
})
export class SetupService {
  constructor (
    private readonly http: HttpService,
    private readonly authService: AuthService,
    private readonly zeroconfMonitor: ZeroconfMonitor,
  ) { }

  async setupTor (torAddress: string, productKey: string): Promise <S9Server> {
    const id = idFromProductKey(productKey)

    // get agent version
    const versionInstalled = await this.getVersion(torAddress)

    // derive keys
    const { privkey, pubkey } = await this.deriveKeys(id)

    // register pubkey
    await this.registerPubkey(torAddress, versionInstalled, pubkey, productKey)

    // get server
    const builder: Required<EmbassyBuilder> = {
      id,
      label: 'Embassy:' + id,
      versionInstalled,
      privkey,
      torAddress,
      staticIP: '',
      connectionType: EmbassyConnection.TOR,
      connectionPreference: ConnectionPreference.LAN_TOR,
      ...await this.getServer(torAddress, versionInstalled, privkey),
    }

    return toS9Server(builder)
  }

  async setupZeroconf (productKey: string): Promise<S9Server> {
    // derive id
    const id = idFromProductKey(productKey)

    // discover zeroconf service
    const zeroconfService = this.zeroconfMonitor.getService(id)
    if (!zeroconfService) { throw new Error('Embassy not found on local network. Please check Product Key and see "Instructions" below') }

    // get IP
    const ip = getLanIP(zeroconfService)
    if (!ip) { throw new Error('IP address not found. Please contact support.') }

    return this.finishLANSetup(ip, id, productKey)
  }

  async setupIP (ip: string, productKey: string): Promise<S9Server> {
    return this.finishLANSetup(ip, idFromProductKey(productKey), productKey, true)
  }

  private async finishLANSetup (host: string, id: string, productKey: string, useStatic = false): Promise<S9Server> {
    // get agent version
    const versionInstalled = await this.getVersion(host)

    // derive keys
    const { privkey, pubkey } = await this.deriveKeys(id)

    // register pubkey
    await this.registerPubkey(host, versionInstalled, pubkey, productKey)

    // tor acquisition. @TODO we don't need this if torAddress comes back in /v0
    const torAddress = await this.getTor(host, versionInstalled, privkey)

    // get server
    const builder: Required<EmbassyBuilder> = {
      id,
      label: 'Embassy:' + id,
      versionInstalled,
      privkey,
      torAddress,
      staticIP: useStatic ? host : '',
      connectionType: EmbassyConnection.LAN,
      connectionPreference: ConnectionPreference.LAN_TOR,
      ...await this.getServer(host, versionInstalled, privkey),
    }

    return toS9Server(builder)
  }

  private async getVersion (host: string): Promise <string> {
    try {
      const { version } = await this.request<ReqRes.GetVersionRes>(host, Method.GET, '/version')
      return version
    } catch (e) {
      console.error(e)
      throw new Error('Failed communicating with Embassy. Potential VPN or router issue. Please see "Instructions" below')
    }
  }

  private async registerPubkey (host: string, versionInstalled: string, pubKey: string, productKey: string): Promise < void > {
    const path = `/v${versionInstalled.charAt(0)}/register`
    const data: ReqRes.PostRegisterReq = { pubKey, productKey }
    // @TODO do I need to pass privkey to this?
    try {
      await this.request<ReqRes.PostRegisterRes>(host, Method.POST, path, undefined, data)
    } catch (e) {
      console.error(e)
      throw new Error (`Auth rejected. Invalid mnemonic or Product Key`)
    }
  }

  private async deriveKeys (id: string): Promise<{ privkey: string, pubkey: string }> {
    try {
      if (!this .authService.mnemonic) {
        throw new Error('Mnemonic not found')
      }
      return cryptoUtil.deriveKeys(this.authService.mnemonic, id)
    } catch (e) {
      console.error(e)
      throw new Error('Error deriving keys. Please contact support')
    }
  }

  private async getTor (host: string, versionInstalled: string, privkey: string): Promise<string> {
    const path = `/v${versionInstalled.charAt(0)}/tor`
    try {
      const { torAddress } = await this.request<ReqRes.GetTorRes>(host, Method.GET, path, privkey)
      return torAddress
    } catch (e) {
      console.error(e)
      throw new Error('Error fetching Tor Address. Please contact support')
    }
  }

  private async getServer (host: string, versionInstalled: string, privkey: string): Promise<ReqRes.GetServerRes> {
    const path = `/v${versionInstalled.charAt(0)}`
    try {
      return this.request<ReqRes.GetServerRes>(host, Method.GET, path, privkey)
    } catch (e) {
      console.error(e)
      throw new Error('Failed getting Embassy information. Please contact support')
    }
  }

  private async request<T> (host: string, method: Method, path: string, privkey ? : string, data ? : any): Promise<T> {
    const options: HttpOptions = {
      method,
      url: `http://${host}:5959${path}`,
      data,
    }
    if (privkey) {
      options.headers = { 'Authorization': getAuthHeader(privkey) }
    }

    return this.http.rawRequest<T>(options)
  }
}

export function toS9Server (builder: Required<EmbassyBuilder>): S9Server {
  return {
    ...builder,
    badge: 0,
    notifications: [],
    versionLatest: undefined, // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
  }
}

export type EmbassyBuilderWith<T extends keyof EmbassyBuilder> = EmbassyBuilder & {
  [t in T]: Exclude<EmbassyBuilder[t], undefined>
}

export interface EmbassyBuilder {
  id?: string
  label?: string
  status?: ServerStatus
  versionInstalled?: string
  privkey?: string
  torAddress?: string
  staticIP: string | undefined
  connectionType?: EmbassyConnection
  connectionPreference: ConnectionPreference
}
