import { Injectable } from '@angular/core'
import { HttpOptions } from 'capacitor-http'
import { ServerModel, S9Server } from '../models/server-model'
import { TokenSigner } from 'jsontokens'
import { HttpService } from './http.service'
import * as uuid from 'uuid'
import { S9BuilderWith } from './setup.service'

@Injectable({
  providedIn: 'root',
})
export class HttpTorService {
  constructor (
    private readonly http: HttpService,
    private readonly serverModel: ServerModel,
  ) { }

  async request<T> (server: string | S9Server | S9BuilderWith<'versionInstalled' | 'privkey' | 'torAddress'>, options: HttpOptions): Promise<T> {
    if (typeof server === 'string') {
      server = this.serverModel.peek(server)
    }
    options.headers = Object.assign(options.headers || { }, getAuthHeader(server.privkey))
    options.url = `http://${server.torAddress}:5959/v${server.versionInstalled.charAt(0)}${options.url}`
    options.proxy = {
      host: 'localhost',
      port: 59590,
      protocol: 'SOCKS',
    }
    return this.http.request(options)
  }
}

function getAuthHeader (privkey: string): { 'Authorization': string } {
  const now = Math.floor(new Date().valueOf() / 1000)
  const tokenPayload = {
    'iss': 'start9-companion',
    'jti': uuid.v4(),
    'iat': now - 1209600,
    'exp': now + 1209600,
  }
  const token = new TokenSigner('ES256K', privkey).sign(tokenPayload)

  return { 'Authorization': 'Bearer ' + token }
}
