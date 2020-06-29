import { Injectable } from '@angular/core'
import { HttpPluginNativeImpl, HttpOptions } from '@start9labs/capacitor-http'
import { ZeroconfMonitor } from './zeroconf.service'
import { TokenSigner } from 'jsontokens'
import { EmbassyBuilderWith } from './setup.service'
import { S9Server, ServerModel, getLanIP, EmbassyConnection, ConnectionPreference } from '../models/server-model'
import { TorService, TorConnection } from './tor.service'
import { NetworkMonitor } from './network.service'
import * as uuid from 'uuid'
const version = require('../../../package.json').version

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor (
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly serverModel: ServerModel,
    private readonly torService: TorService,
    private readonly networkMonitor: NetworkMonitor,
  ) { }

  async serverRequest<T> (server: string | S9Server | EmbassyBuilderWith<'versionInstalled' | 'privkey' | 'torAddress'>, options: HttpOptions, withVersion = true): Promise<T> {
    if (typeof server === 'string') {
      server = this.serverModel.peek(server)
    }
    options.headers = Object.assign(options.headers || { }, {
      'Authorization': getAuthHeader(server.privkey),
    })

    let host: string
    let connectionType: EmbassyConnection

    // LAN/Tor
    if (server.connectionPreference === ConnectionPreference.LAN_TOR) {
      if (server.staticIP) {
        connectionType = EmbassyConnection.LAN
        host = server.staticIP
      } else {
        const zcs = this.zeroconfMonitor.getService(server.id)

        if (zcs) {
          connectionType = EmbassyConnection.LAN
          host = getLanIP(zcs)
        } else {
          connectionType = EmbassyConnection.TOR
          host = server.torAddress.trim() // @COMPAT Ambassador <= 1.3.0 retuned torAddress with trailing "\n"
        }
      }
    // LAN only
    } else if (server.connectionPreference === ConnectionPreference.LAN) {
      if (server.staticIP) {
        connectionType = EmbassyConnection.LAN
        host = server.staticIP
      } else {
        const zcs = this.zeroconfMonitor.getService(server.id)

        if (zcs) {
          connectionType = EmbassyConnection.LAN
          host = getLanIP(zcs)
        } else {
          throw new Error('Embassy not found on LAN')
        }
      }
    // Tor only
    } else if (server.connectionPreference === ConnectionPreference.TOR) {
      connectionType = EmbassyConnection.TOR
      host = server.torAddress.trim() // @COMPAT Ambassador <= 1.3.0 retuned torAddress with trailing "\n"
    }

    const ambassadorVersion = withVersion ? `/v${server.versionInstalled.charAt(0)}` : ''
    options.url = `http://${host}:5959${ambassadorVersion}${options.url}`

    const res = await this.rawRequest<T>(options)

    if (connectionType !== server.connectionType) {
      this.serverModel.updateServer(server.id, { connectionType })
    }

    return res
  }

  async rawRequest<T> (options: HttpOptions): Promise<T> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })

    if (options.method === Method.POST && !options.data) {
      options.data = { }
    }

    if (!(this.networkMonitor.peekConnection()).connected) {
      throw new Error('Internet disconnected')
    }

    if (options.url.includes('.onion')) {
      if (this.torService.peekConnection() !== TorConnection.connected) {
        throw new Error('Tor not connected')
      }
      options.proxy = {
        host: 'localhost',
        port: TorService.PORT,
        protocol: 'SOCKS',
      }
    }

    try {
      const res = await HttpPluginNativeImpl.request(options)
      return res.data || { }
    } catch (e) {
      console.error(e)

      let message: string
      try {
        message = JSON.parse(e.error).message
      } catch (e) {
        message = e.error || 'Unknown Error'
      }
      throw new Error(message)
    }
  }
}

export function getAuthHeader (privkey: string): string {
  const now = Math.floor(new Date().valueOf() / 1000)
  const tokenPayload = {
    'iss': 'start9-companion',
    'jti': uuid.v4(),
    'iat': now - 1209600,
    'exp': now + 1209600,
  }
  const token = new TokenSigner('ES256K', privkey).sign(tokenPayload)

  return `Bearer ${token}`
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
