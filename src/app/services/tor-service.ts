import { Injectable } from '@angular/core'
// import { Method } from '../../types/enums'
import { HttpHeaders } from '@angular/common/http'

@Injectable()
export class TorService {
  torAddress = ''

  constructor () { }

  async handshake (): Promise<void> {
    // const headers: HttpHeaders = new HttpHeaders({ 'timeout': '3000' })
    // return this.request(Method.post, this.torAddress + '/handshake', { headers })
  }
}