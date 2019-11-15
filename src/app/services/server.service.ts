import { Injectable } from '@angular/core'
import { HttpService } from './http.service'
import { Method } from '../types/enums'
import { Lan } from '../types/api-types'
import { S9Server } from '../models/s9-server'

@Injectable({
  providedIn: 'root',
})
export class ServerService {

  constructor (
    private readonly httpService: HttpService,
  ) { }

  async getSpecs (server: S9Server): Promise<any> {
    // @TODO remove
    return mockServerSpecs
    // return this.httpService.authServerRequest<Lan.GetSpecsRes>(server, Method.get, '/specs')
  }
}

const mockServerSpecs = [
  {
    name: 'CPU',
    value: 'Broadcom BCM2711, Quad core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz',
  },
  {
    name: 'RAM',
    value: '4GB LPDDR4-2400 SDRAM',
  },
  {
    name: 'WiFI',
    value: '2.4 GHz and 5.0 GHz IEEE 802.11ac wireless, Bluetooth 5.0, BLE',
  },
  {
    name: 'Ethernet',
    value: 'Gigabit',
  },
  {
    name: 'Disk',
    value: '512 GB Flash (280 GB available)',
  },
]