import { Injectable } from '@angular/core'
import { Observable, BehaviorSubject } from 'rxjs'
import { Mutex } from 'async-mutex'
import { ConnectionStatus, Network } from '@capacitor/network'
import { PluginListenerHandle } from '@capacitor/core'

const mutex = new Mutex()

@Injectable({
  providedIn: 'root',
})
export class NetworkMonitor {
  private readonly networkStatus$ = new BehaviorSubject<ConnectionStatus>({ connected: false, connectionType: 'none' })
  watchConnection (): Observable<ConnectionStatus> { return this.networkStatus$.asObservable() }
  peekConnection (): ConnectionStatus { return this.networkStatus$.getValue() }
  private listener: PluginListenerHandle
  private previous: string | undefined

  async init (): Promise<void> {
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

  stop (): void {
    this.networkStatus$.next({ connected: false, connectionType: 'none' })
    this.listener.remove()
  }
}