import { Injectable } from '@angular/core'
import { HTTP } from '@ionic-native/http/ngx'
import { S9Server, getLanIP } from '../models/server-model'
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
  ) {
    this.http.setDataSerializer('json')
    this.http.setHeader('*', 'app-version', version)
    this.http.setRequestTimeout(5)
  }

  async authServerRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled' | 'privkey'>,
    path: string,
    options: HttpNativeOptions,
  ): Promise<T> {
    options.headers = Object.assign(options.headers || { }, getAuthHeader(server))
    return this.serverRequest(server, path, options)
  }

  async serverRequest<T> (
    server: S9Server | S9BuilderWith<'versionInstalled'>,
    path: string,
    options: HttpNativeOptions,
  ): Promise<T> {
    const url = this.s9Url(server, path)
    return this.request(url, options)
  }

  async request<T> (url: string, options: HttpNativeOptions): Promise<T> {
    console.log('Request URL: ', url)
    console.log('Request Options: ', options)

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
      throw new Error(e.error)
    }
  }

  s9Url (server: S9Server | S9BuilderWith<'versionInstalled'>, path: string): string {
    const zeroconf = this.zerconfDaemon.getService(server.id)
    if (!zeroconf) { throw new Error('S9 Server not found on LAN') }
    const host = getLanIP(zeroconf)
    return `http://${host}/v${server.versionInstalled.charAt(0)}${path}`
  }
}

function getAuthHeader (server: S9Server | S9BuilderWith<'privkey'>): { 'Authorization': string }  {
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