import { Injectable } from '@angular/core'
// import { Method } from '../../types/enums'
// import { HttpHeaders } from '@angular/common/http'
import { Zeroconf } from '@ionic-native/zeroconf/ngx'

@Injectable()
export class LANService {
  macAddress = ''

  constructor (
    private zeroconf: Zeroconf,
  ) { }

  async discover (): Promise<void> {
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      const service = result.service
      if (result.action === 'added') {
        console.log('service added', service)
        this.macAddress = service.domain
      } else {
        console.log('service removed', service)
      }
    })
  }

  async handshake (): Promise<void> {
    // const headers: HttpHeaders = new HttpHeaders({ 'timeout': '3000' })
    // return this.request(Method.post, this.torAddress + '/handshake', { headers })
  }
}