import { Injectable } from '@angular/core'
import { Plugins, NetworkStatus, PluginListenerHandle } from '@capacitor/core'
import { Observable, Subject } from 'rxjs'
import { AuthService } from './auth.service'
import { AuthStatus } from '../types/enums'

const { Network } = Plugins

@Injectable({
  providedIn: 'root',
})
export class NetworkMonitor {
  private readonly networkStatus$ = new Subject<NetworkStatus>()
  watchConnection (): Observable<NetworkStatus> { return this.networkStatus$.asObservable() }
  peekConnection (): Promise<NetworkStatus> { return Network.getStatus() }
  private listener: PluginListenerHandle | undefined

  constructor (
    private readonly authService: AuthService,
  ) { }

  init () {
    this.authService.watch().subscribe(authStatus => this.handleAuthChange(authStatus))
  }

  handleAuthChange (authStatus: AuthStatus) {
    if (authStatus === AuthStatus.VERIFIED) {
      this.start()
    } else if (authStatus === AuthStatus.MISSING) {
      this.stop()
    }
  }

  async start () {
    if (this.listener) { return }

    console.log('starting network listener')

    this.networkStatus$.next(await Network.getStatus())

    this.listener = Network.addListener('networkStatusChange', (status) => {
      console.log('network status changed', status)
      this.networkStatus$.next(status)
    })
  }

  stop () {
    if (!this.listener) { return }

    console.log('stopping Network listener')

    this.listener.remove()
    this.listener = undefined
  }
}