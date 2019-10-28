import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpHeaders } from '@angular/common/http'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'
import { HttpService } from './http-service'

@Injectable()
export class LANService {
  ipAddress = ''

  constructor (
    public zeroconf: Zeroconf,
    public httpService: HttpService,
  ) { }

  async discover (hostname: string): Promise<void> {
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      const service = result.service
      if (result.action === 'added') {
        console.log('service added', service)
        if (service.hostname === hostname) {
          this.ipAddress = service.ipv4Addresses[0]
        }
      } else {
        console.log('service removed', service)
      }
    })
  }

  async handshake (): Promise<void> {
    const headers: HttpHeaders = new HttpHeaders({ 'timeout': '3000' })
    return this.httpService.request(Method.post, this.ipAddress + '/handshake', { headers })
  }
}