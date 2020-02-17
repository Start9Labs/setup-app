import { Injectable } from '@angular/core'
import { HTTP } from '@ionic-native/http/ngx'
import { S9Server, getLanIP, ServerModel } from '../models/server-model'
import { S9BuilderWith } from './setup.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { TokenSigner } from 'jsontokens'
import { Method } from '../types/enums'
import * as uuid from 'uuid'
const version = require('../../../package.json').version

@Injectable({
  providedIn: 'root',
})
export class HttpNativeService {

  constructor (
    private readonly http: HTTP,
    private readonly zerconfDaemon: ZeroconfDaemon,
    private readonly serverModel: ServerModel,
  ) {
  }

  async authServerRequest<T> (
    serverId: string,
    path: string,
    options: HttpNativeOptions,
  ): Promise<T> {
    const server = this.serverModel.peekServer(serverId)
    options.headers = Object.assign(options.headers || { }, getAuthHeader(server))
    options.timeout = options.timeout || 10
    return this.serverRequest(server, path, options)
  }

  async serverRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled'>,
    path: string,
    options: HttpNativeOptions,
  ): Promise<T> {
    const url = s9Url(this.zerconfDaemon, server, path)
    return this.request<T>(url, options)
  }

  async request<T> (url: string, options: HttpNativeOptions): Promise<T> {
    this.http.setDataSerializer('json')
    this.http.setHeader('*', 'app-version', version)
    if (options.method === Method.post && !options.data) {
      options.data = { }
    }

    console.log('Request URL: ', url)

    try {
      const res = await this.http.sendRequest(url, options)
      if (res.data) {
        return JSON.parse(res.data)
      } else {
        return { } as T
      }
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

export function s9Url(zcd: ZeroconfDaemon, server: S9Server | S9BuilderWith<'versionInstalled'>, path: string): string {
  const zeroconf = zcd.getService(server.id)
  if (!zeroconf) { throw new Error('S9 Server not found on LAN') }
  const host = getLanIP(zeroconf)
  return `http://${host}/v${server.versionInstalled.charAt(0)}${path}`
}

export function getAuthHeader (server: S9Server | S9BuilderWith<'privkey'>): { 'Authorization': string } {
  const now = Math.floor(new Date().valueOf() / 1000)
  const tokenPayload = {
    'iss': 'start9-companion',
    'jti': uuid.v4(),
    'iat': now - 1209600,
    'exp': now + 1209600,
  }
  const token = new TokenSigner('ES256K', server.privkey).sign(tokenPayload)

  return { 'Authorization': 'Bearer ' + token }
}

export interface HttpNativeOptions {
  method: Method
  data?: {
    [key: string]: any
  }
  params?: {
    [key: string]: string | number
  }
  serializer?: 'json' | 'urlencoded' | 'utf8' | 'multipart'
  timeout?: number // seconds
  headers?: {
    [key: string]: string
  }
  filePath?: string | string[]
  name?: string | string[]
  responseType?: 'text' | 'arraybuffer' | 'blob' | 'json'
}