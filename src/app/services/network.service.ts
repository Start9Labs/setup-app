import { Injectable } from '@angular/core'
import { Plugins, NetworkStatus, PluginListenerHandle } from '@capacitor/core'
import { Observable, BehaviorSubject } from 'rxjs'
import { Mutex } from 'async-mutex'

const { Network } = Plugins
const mutex = new Mutex()

@Injectable({
  providedIn: 'root',
})
export class NetworkMonitor {
  private readonly networkStatus$ = new BehaviorSubject<NetworkStatus>({ connected: false, connectionType: 'none' })
  watchConnection (): Observable<NetworkStatus> { return this.networkStatus$.asObservable() }
  peekConnection (): NetworkStatus { return this.networkStatus$.getValue() }
  private listener: PluginListenerHandle
  private previous: string | undefined

  async init () {
    console.log('starting network listener')

    this.networkStatus$.next(await Network.getStatus())

    this.listener = Network.addListener('networkStatusChange', async (status) => {
      await mutex.runExclusive(() => {
        const current = JSON.stringify(status)

        if (current === this.previous) { return }

        console.log('network status changed', status)
        this.previous = current
        this.networkStatus$.next(status)
      })
    })
  }

  unint (): void {
    this.networkStatus$.next({ connected: false, connectionType: 'none' })
    this.listener.remove()
  }
}