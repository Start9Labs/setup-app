import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfResult, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription, Observable, BehaviorSubject, ReplaySubject } from 'rxjs'
import { Platform } from '@ionic/angular'
import { NetworkService } from './network.service'
import { NetworkStatus } from '@capacitor/core'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfMonitor {
  private readonly serviceFound$ = new ReplaySubject<ZeroconfService>(10)
  private readonly serviceExists$ = new BehaviorSubject<boolean>(false)
  watchServiceFound (): Observable<ZeroconfService> { return this.serviceFound$.asObservable() }
  watchServiceExists (): Observable<boolean> { return this.serviceExists$.asObservable() }
  services: { [hostname: string]: ZeroconfServiceExt } = { }
  private zeroconfSub: Subscription | undefined
  readonly timeToPurge = 4000

  constructor (
    private readonly platform: Platform,
    private readonly zeroconf: Zeroconf,
    private readonly networkService: NetworkService,
  ) { }

  init (): void {
    this.networkService.watch().subscribe(n => this.handleNetworkChange(n))
  }

  handleNetworkChange (network: NetworkStatus): void {
    if (network.connectionType === 'wifi') {
      this.start()
    } else {
      this.stop()
    }
  }

  getService (serverId: string): ZeroconfService | undefined {
    return this.services[`start9-${serverId}`]
  }

  private async start (): Promise<void> {
    // return this.mock()

    if (!this.platform.is('cordova')) { return }

    if (this.zeroconfSub) { await this.zeroconf.reInit() }

    console.log('starting zeroconf monitor')

    setTimeout(now => this.purgeOld(now), this.timeToPurge, new Date().valueOf())

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      this.handleServiceUpdate(result)
    })
  }

  private stop (): void {
    this.services = { }
    if (!this.zeroconfSub) { return }
    console.log('stopping zeroconf monitor')
    this.zeroconfSub.unsubscribe()
    this.zeroconfSub = undefined
  }

  private handleServiceUpdate (result: ZeroconfResult): void {
    const { action, service } = result

    if (!service.name.startsWith('start9-')) { return }

    if (action === 'resolved' && service.ipv4Addresses[0]) {
      // if exists with same IP, update discoveredAt
      if (this.services[service.name] && service.ipv4Addresses[0] === this.services[service.name].ipv4Addresses[0]) {
        console.log(`rediscovered zeroconf service: ${service.name}`)
        this.services[service.name].discoveredAt = new Date().valueOf()
      // if not exists, add it
      } else {
        console.log(`discovered zeroconf service: ${service.name}`)
        this.services[service.name] = { ...service, discoveredAt: new Date().valueOf() }
        this.serviceFound$.next(service)
        this.serviceExists$.next(true)
      }
    }

    if (action === 'removed') {
      delete this.services[service.name]
      this.serviceExists$.next(Object.keys(this.services).length === 0)
    }
  }

  private purgeOld (initializedAt: number): void {
    Object.keys(this.services).forEach(key => {
      if (this.services[key].discoveredAt < initializedAt) {
        console.log(`purging zeroconf service: ${this.services[key].name}`)
        delete this.services[key]
      }
    })
  }

  // @TODO remove
  mock (): void {
    const result: ZeroconfResult = {
      action: 'resolved',
      service: {
        domain: 'local.',
        type: '_http._tcp',
        name: 'start9-1f3ce404',
        hostname: '',
        ipv4Addresses: ['192.168.20.1'],
        ipv6Addresses: ['end9823u0ej2fb'],
        port: 5959,
        txtRecord: { },
      },
    }

    this.handleServiceUpdate(result)
  }
}

export type ZeroconfServiceExt = ZeroconfService & { discoveredAt: number }
