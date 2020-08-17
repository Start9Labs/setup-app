import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'

import { Plugins } from '@capacitor/core'
const { Storage } = Plugins

export interface Device {
  id: string
  type: 'Embassy'
  torAddress: string
  cert: string
}

@Injectable({
  providedIn: 'root',
})
export class AppState {
  $devices$: BehaviorSubject<Device[]> = new BehaviorSubject([])
  watchDevices (): Observable<Device[]> { return this.$devices$.asObservable() }
  peekDevices (): Device[] { return this.$devices$.getValue() }

  async load (): Promise<void> {
    const devices = JSON.parse((await Storage.get({ key: 'devices' })).value)
    this.$devices$.next(devices || [])
  }

  async addDevice (id: string, torAddress: string, cert: string): Promise<void> {
    const devices = this.peekDevices().filter(d => d.id !== id)
    devices.push({
      id,
      type: 'Embassy',
      torAddress,
      cert,
    })
    await this.save(devices)
  }

  async removeDevice (id: string): Promise<void> {
    const devices = this.peekDevices().filter(d => d.id !== id)
    await this.save(devices)
  }

  async save (devices: Device[]): Promise<void> {
    await Storage.set({ key: 'devices', value: JSON.stringify(devices) })
    this.$devices$.next(devices)
  }
}
