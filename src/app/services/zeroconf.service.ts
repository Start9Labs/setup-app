import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfResult, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription, BehaviorSubject, Observable } from 'rxjs'
import { Platform } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfMonitor {
  private readonly serviceFound$ : BehaviorSubject<ZeroconfService | null> = new BehaviorSubject(null)
  watch (): Observable<ZeroconfService | null> { return this.serviceFound$ }
  services: { [hostname: string]: ZeroconfServiceExt } = { }
  private zeroconfSub: Subscription | undefined
  readonly timeToPurge = 4000

  constructor (
    private readonly platform: Platform,
    private readonly zeroconf: Zeroconf,
  ) { }

  init (): void {
    this.start(false)
  }

  getService (serverId: string): ZeroconfService | undefined {
    return this.services[`start9-${serverId}`]
  }

  private async start (restart: boolean): Promise<void> {
    return this.mock()

    if (this.zeroconfSub || !this.platform.is('mobile')) { return }

    console.log('starting zeroconf daemon')

    if (restart) { await this.zeroconf.reInit() }

    setTimeout(now => this.purgeOld(now), this.timeToPurge, new Date().valueOf())

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      this.handleServiceUpdate(result)
    })
  }

  private stop (): void {
    if (this.zeroconfSub) {
      console.log('stopping zeroconf daemon')
      this.zeroconfSub.unsubscribe()
      this.zeroconfSub = undefined
    }
  }

  private reset (): void {
    this.stop()
    this.start(true)
  }

  private clearAndStop (): void {
    this.stop()
    console.log('clearing all zerconf services')
    this.services = { }
  }

  private handleServiceUpdate (result: ZeroconfResult): void {
    const { action, service } = result

    if (
      service.name.startsWith('start9-')
      && action === 'resolved'
      && service.ipv4Addresses[0]
    ) {
      // if exists with same IP, update discoveredAt
      if (this.services[service.name] && service.ipv4Addresses[0] === this.services[service.name].ipv4Addresses[0]) {
        console.log(`rediscovered zeroconf service: ${service.name}`)
        this.services[service.name].discoveredAt = new Date().valueOf()
      // if not exists, add it
      } else {
        console.log(`discovered zeroconf service: ${service.name}`)
        this.services[service.name] = { ...service, discoveredAt: new Date().valueOf() }
        this.serviceFound$.next(service)
      }
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
