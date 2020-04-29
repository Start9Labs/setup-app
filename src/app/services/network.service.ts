import { Injectable } from '@angular/core'
import { Plugins, NetworkStatus, PluginListenerHandle } from '@capacitor/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { AuthService } from './auth.service'
import { AuthStatus } from '../types/enums'

const { Network } = Plugins

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private readonly networkStatus$ = new BehaviorSubject<NetworkStatus['connectionType']>('unknown')
  watch (): Observable<NetworkStatus['connectionType']> { return this.networkStatus$ }
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

  start () {
    if (!this.listener) {
      console.log('starting network listener')
      this.listener = Network.addListener('networkStatusChange', (status) => this.networkStatus$.next(status.connectionType))
    }
  }

  stop () {
    if (this.listener) {
      console.log('stopping Network listener')
      this.listener.remove()
      this.listener = undefined
    }
  }
}