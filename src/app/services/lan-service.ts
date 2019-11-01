import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService } from './http-service'
import { LANStart9Server } from 'src/types/Start9Server';

@Injectable()
export class LANService {
  constructor (
    public httpService: HttpService,
  ) { }

  async getTorAddress (server: LANStart9Server): Promise<string> {
    return this.httpService.request<{ torAddress: string }>(Method.get, server.lanIpAddress + '/tor').then(r => r.torAddress)
  }

  async handshake (server: LANStart9Server): Promise<boolean> {
    return this.httpService.request(Method.post, server.lanIpAddress + '/handshake')
      .then(() => true)
      .catch(() => false)
  }
}