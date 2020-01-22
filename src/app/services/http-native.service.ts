import { Injectable } from '@angular/core'
import { HTTP } from '@ionic-native/http/ngx'
import { S9Server, getLanIP, ServerModel } from '../models/server-model'
import { S9BuilderWith } from './setup.service'
import { ZeroconfDaemon } from '../daemons/zeroconf-daemon'
import { TokenSigner } from 'jsontokens'
import { Method } from '../types/enums'
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
    const server = this.serverModel.peek(serverId)
    options.headers = Object.assign(options.headers || { }, getAuthHeader(server))
    return this.serverRequest(server, path, options)
  }

  async serverRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled'>,
    path: string,
    options: HttpNativeOptions,
  ): Promise<T> {
    const url = this.s9Url(server, path)
    return this.request<T>(url, options)
  }

  async request<T> (url: string, options: HttpNativeOptions): Promise<T> {
    this.http.setDataSerializer('json')
    this.http.setHeader('*', 'app-version', version)
    this.http.setRequestTimeout(5)
    if (options.method === Method.post && !options.data) {
      options.data = { }
    }

    console.log('Request URL: ', url)
    console.log('Request Options: ', options, '. Request * Full Headers: ', this.http.getHeaders('*'))

    try {
      const res = await this.http.sendRequest(url, options)
      console.log('RESPONSE', res)
      if (res.data) {
        return JSON.parse(res.data)
      } else {
        return { } as T
      }
    } catch (e) {
      console.error(e)
      let message: string
      if (e.error && typeof e.error === 'object') {
        message = e.error.message || e.message || JSON.stringify(e.error)
      } else if (e.errors && e.errors.length && Array.isArray(e.errors)) {
        const error = e.errors[0]
        message = error.message || JSON.stringify(error)
      } else {
        message = e.message || JSON.stringify(e)
      }
      throw new Error(message)
    }
  }

  s9Url (server: S9Server | S9BuilderWith<'versionInstalled'>, path: string): string {
    const zeroconf = this.zerconfDaemon.getService(server.id)
    if (!zeroconf) { throw new Error('S9 Server not found on LAN') }
    const host = getLanIP(zeroconf)
    return `http://${host}/v${server.versionInstalled.charAt(0)}${path}`
  }
}

export function getAuthHeader (server: S9Server | S9BuilderWith<'privkey'>): { 'Authorization': string } {
  const past = Math.floor((new Date().getTime() - 30000) / 1000)
  const tokenPayload = { 'iss': 'start9-companion', 'iat': past, 'exp': past + 60 }
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
  timeout?: number
  headers?: {
    [key: string]: string
  }
  filePath?: string | string[]
  name?: string | string[]
  responseType?: 'text' | 'arraybuffer' | 'blob' | 'json'
}