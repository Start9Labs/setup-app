import { Injectable } from '@angular/core'

import { Plugins } from '@capacitor/core'
import { BehaviorSubject, Observable } from 'rxjs'
const { Storage } = Plugins

export interface Device {
  id: string
  label: string
  torAddress: string
  type: 'Embassy'
}

@Injectable({
  providedIn: 'root',
})
export class AppState {
  $devices$: BehaviorSubject<Device[]> = new BehaviorSubject([])
  watchDevices (): Observable<Device[]> { return this.$devices$.asObservable() }
  peekDevices (): Device[] { return this.$devices$.getValue() }

  async load (): Promise<void> {
    const devices = JSON.parse((await Storage.get({ key: 'servers' })).value)
    this.$devices$.next(devices || [])
  }

  async addDevice (device: Device): Promise<void> {
    const devices = this.peekDevices().filter(d => d.id !== device.id)
    devices.push(device)
    await this.save(devices)
  }

  async removeDevice (id: string): Promise<void> {
    const devices = this.peekDevices().filter(d => d.id !== id)
    await this.save(devices)
  }

  async save (devices: Device[]): Promise<void> {
    await Storage.set({ key: 'servers', value: JSON.stringify(devices) })
    this.$devices$.next(devices)
  }
}
