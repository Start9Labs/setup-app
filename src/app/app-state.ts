import { Injectable } from '@angular/core'

import { Plugins } from '@capacitor/core'
import { BehaviorSubject, Observable } from 'rxjs'
const { Storage } = Plugins

export interface Device {
  id: string
  label: string
  torAddress: string
  type: 'embassy'
}

@Injectable({
  providedIn: 'root',
})
export class AppState {
  $devices$: BehaviorSubject<Device[]> = new BehaviorSubject([])
  watchDevices (): Observable<Device[]> { return this.$devices$.asObservable() }

  async load (): Promise<void> {
    const devices = JSON.parse((await Storage.get({ key: 'servers' })).value)
    this.$devices$.next(devices || [])
  }
}
