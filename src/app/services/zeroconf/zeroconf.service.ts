

import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfResult, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription, Observable, BehaviorSubject, ReplaySubject } from 'rxjs'
import { Platform } from '@ionic/angular'
import { NetworkMonitor } from '../network.service'
import { NetworkStatus } from '@capacitor/core'

@Injectable({
  providedIn: 'root',
})
export abstract class ZeroconfMonitor {
  protected readonly serviceFound$ = new ReplaySubject<ZeroconfService>(10)
  protected readonly serviceExists$ = new BehaviorSubject<boolean>(false)
  watchServiceFound (): Observable<ZeroconfService> { return this.serviceFound$.asObservable() }
  watchServiceExists (): Observable<boolean> { return this.serviceExists$.asObservable() }
  services: { [hostname: string]: ZeroconfService } = { }
  protected zeroconfSub: Subscription
  protected networkSub: Subscription

  constructor (
    protected readonly platform: Platform,
    protected readonly zeroconf: Zeroconf,
    protected readonly networkMonitor: NetworkMonitor,
  ) { }

  abstract start (): Promise<void> 

  init (): void {
    this.networkSub = this.networkSub || this.networkMonitor.watchConnection().subscribe(n => this.handleNetworkChange(n))
  }

  getService (serverId: string): ZeroconfService | undefined {
    return this.services[`start9-${serverId}`]
  }

  protected handleNetworkChange (network: NetworkStatus): void {
    this.stop()
    if (network.connectionType === 'wifi') {
      this.start()
    }
  }

  protected stop (): void {
    if (!this.zeroconfSub) { return }
    console.log('stopping zeroconf monitor')
    for (let service of Object.values(this.services)) {
      this.removeService(service)
    }
    this.zeroconfSub.unsubscribe()
  }

  protected handleServiceUpdate (result: ZeroconfResult): void {
    const { action, service } = result

    // don't care about non-Start9 stuff
    if (!service.name.startsWith('start9-')) { return }

    if (action === 'resolved' && service.ipv4Addresses[0]) {
      // if exists and IPs changed, update it
      if (this.services[service.name] && service.ipv4Addresses[0] !== this.services[service.name].ipv4Addresses[0]) {
        console.log(`IP changed for zerconf service: ${service.name}`)
        this.removeService(service)
        this.addService(service)
      // if not exists, add it
      } else {
        this.addService(service)
      }
    } else if (action === 'removed') {
      this.removeService(service)
    }
  }

  protected addService (service: ZeroconfService): void {
    console.log(`discovered zeroconf service: ${service.name}`)
    // add service and broadcast existence
    this.services[service.name] = service
    this.serviceFound$.next(service)
    // if first service, broadcast serviceExists$ with true
    if (Object.keys(this.services).length === 1) {
      this.serviceExists$.next(true)
    }
  }

  protected removeService (service: ZeroconfService): void {
    console.log(`removing zeroconf service: ${service.name}`)
    // remove service
    delete this.services[service.name]
    // if no services remain, broadcast serviceExists$ with false
    if (!Object.keys(this.services).length) {
      this.serviceExists$.next(false)
    }
  }
}
