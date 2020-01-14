import { Injectable } from '@angular/core'
import { Zeroconf, ZeroconfResult, ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Subscription } from 'rxjs'
import { Platform } from '@ionic/angular'
import { AuthService } from '../services/auth.service'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class ZeroconfDaemon {
  services: { [hostname: string]: ZeroconfService } = { }
  private zeroconfSub: Subscription | undefined
  private pauseSub: Subscription | undefined
  private resumeSub: Subscription | undefined

  constructor (
    private readonly platform: Platform,
    private readonly zeroconf: Zeroconf,
    private readonly authService: AuthService,
  ) { }

  init () {
    this.authService.authState.subscribe(authStatus => {
      if (authStatus === AuthStatus.authed) {
        if (!this.pauseSub) {
          this.pauseSub = this.platform.pause.subscribe(() => {
            this.stop()
          })
        }
        if (!this.resumeSub) {
          this.resumeSub = this.platform.resume.subscribe(() => {
            this.reset()
          })
        }
        this.start()
      } else if (authStatus === AuthStatus.unauthed) {
        if (this.pauseSub) {
          this.pauseSub.unsubscribe()
          this.pauseSub = undefined
        }
        if (this.resumeSub) {
          this.resumeSub.unsubscribe()
          this.resumeSub = undefined
        }
        this.stop()
      }
    })
  }

  start () {
    // return this.mock()

    if (!this.platform.is('cordova')) { return }

    this.zeroconfSub = this.zeroconf.watch('_http._tcp.', 'local.').subscribe(async result => {
      await this.handleServiceUpdate(result)
    })
  }

  stop () {
    if (this.zeroconfSub) {
      this.zeroconfSub.unsubscribe()
      this.zeroconfSub = undefined
    }
    this.services = { }
  }

  async reset () {
    this.stop()
    await this.zeroconf.reInit()
    this.start()
  }

  async handleServiceUpdate (result: ZeroconfResult) {
    const { action, service } = result
    console.log(`zeroconf service ${action}`, service)

    if (
      service.name.startsWith('start9-')
      && ['added', 'resolved'].includes(action)
      && !this.services[service.name]
      && service.ipv4Addresses.length
    ) {
      console.log(`discovered start9 server: ${service.name}`)
      this.services[service.name] = service
    }
  }

  // @TODO remove
  async mock () {
    const result: ZeroconfResult = {
      action: 'added',
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

    await this.handleServiceUpdate(result)
  }
}


