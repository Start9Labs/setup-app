import { Injectable } from '@angular/core'
import { HttpOptions } from 'capacitor-http'
import { ZeroconfMonitor } from './zeroconf.service'
import { S9BuilderWith } from './setup.service'
import { getLanIP } from '../models/server-model'
import { HttpService } from './http.service'

@Injectable({
  providedIn: 'root',
})
export class HttpLanService {
  constructor (
    private readonly http: HttpService,
    private readonly zeroconfMonitor: ZeroconfMonitor,
  ) { }

  async request<T> (server: S9BuilderWith<'versionInstalled'>, options: HttpOptions): Promise<T> {
    options.url = this.getLanUrl(server, options.url)
    return this.http.request<T>(options)
  }

  getLanUrl (server: S9BuilderWith<'versionInstalled'>, path: string): string {
    const zcs = this.zeroconfMonitor.getService(server.id)
    if (!zcs) { throw new Error('Embassy not found on LAN') }
    const ip = getLanIP(zcs)
    return `http://${ip}:5959/v${server.versionInstalled.charAt(0)}${path}`
  }
}
