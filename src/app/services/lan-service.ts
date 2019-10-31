import { Injectable } from '@angular/core'
import { Method } from '../../types/enums'
import { HttpService } from './http-service'
import { LANStart9Server } from 'src/types/misc'

@Injectable()
export class LANService {
  constructor (
    public httpService: HttpService,
  ) { }

  async handshake (server: LANStart9Server): Promise<boolean> {
    return this.httpService.request(Method.post, server.ipAddress + '/handshake')
      .then(() => true)
      .catch(() => false)
  }
}