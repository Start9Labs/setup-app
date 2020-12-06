import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { idFromProductKey } from './services/http/http.service'

import { Plugins } from '@capacitor/core'
const { Storage } = Plugins

export interface Device {
  claimedAt: Date
  type: 'Embassy'
  label: string
  productKey: string
  torAddress: string
  lanAddress: string
  cert: Cert
}

export interface Cert {
  name: string
  cert: string
}

@Injectable({
  providedIn: 'root',
})
export class Store {
  $devices$: BehaviorSubject<Device[]> = new BehaviorSubject([])
  watchDevices (): Observable<Device[]> { return this.$devices$.asObservable() }
  peekDevices (): Device[] { return this.$devices$.getValue() }

  async load (): Promise<void> {
    const devices = JSON.parse((await Storage.get({ key: 'devices' })).value)
    this.$devices$.next(devices || [])
    console.log(this.peekDevices())
  }

  async addDevice (claimedAt: Date, productKey: string, torAddress: string, lanAddress: string, cert: Cert): Promise<void> {
    const devices = this.peekDevices().filter(d => d.productKey !== productKey)
    devices.push({
      claimedAt,
      type: 'Embassy',
      label: `Embassy:${idFromProductKey(productKey)}`,
      productKey,
      torAddress,
      lanAddress,
      cert,
    })
    await this.save(devices)
  }

  async updateDevice (productKey: string, label: string): Promise<void> {
    const devices = this.peekDevices()
    const device = devices.find(d => d.productKey === productKey)
    device.label = label
    await this.save(devices)
  }

  async removeDevice (productKey: string): Promise<void> {
    const devices = this.peekDevices().filter(d => d.productKey !== productKey)
    await this.save(devices)
  }

  async save (devices: Device[]): Promise<void> {
    await Storage.set({ key: 'devices', value: JSON.stringify(devices) })
    this.$devices$.next(devices)
  }
}
