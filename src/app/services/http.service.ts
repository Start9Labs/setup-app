import { Injectable } from '@angular/core'
import { HttpPluginNativeImpl, HttpOptions } from 'capacitor-http'
import { ZeroconfMonitor } from './zeroconf.service'
import { Method } from '../types/enums'
import { TokenSigner } from 'jsontokens'
import { S9BuilderWith } from './setup.service'
import { S9Server, ServerModel, getLanIP } from '../models/server-model'
import * as uuid from 'uuid'
const version = require('../../../package.json').version

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  constructor (
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly serverModel: ServerModel,
  ) { }

  async serverRequest<T> (server: string | S9Server | S9BuilderWith<'versionInstalled' | 'privkey' | 'torAddress'>, options: HttpOptions): Promise<T> {
    if (typeof server === 'string') {
      server = this.serverModel.peek(server)
    }
    options.headers = Object.assign(options.headers || { }, {
      'Authorization': getAuthHeader(server.privkey),
    })

    const zcs = this.zeroconfMonitor.getService(server.id)

    let host: string
    if (zcs) {
      host = getLanIP(zcs)
    } else {
      host = server.torAddress
      options.proxy = {
        host: 'localhost',
        port: 59590,
        protocol: 'SOCKS',
      }
    }

    options.url = `http://${host}:5959/v${server.versionInstalled.charAt(0)}${options.url}`

    return this.rawRequest<T>(options)
  }

  async rawRequest<T> (options: HttpOptions): Promise<T> {
    options.headers = Object.assign(options.headers || { }, {
      'Content-Type': 'application/json',
      'app-version': version,
    })
    if (options.method === Method.POST && !options.data) {
      options.data = { }
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
        message = e.error
      }
      throw new Error(message || 'Unknown Error')
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
