import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { Observable, BehaviorSubject, Subscription } from 'rxjs'
import { NetworkMonitor } from './network.service'
import { NetworkStatus } from '@capacitor/core'
import { Platform } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class TorService {
  static readonly PORT = 59590
  private readonly tor = new Tor()
  private readonly progress$ = new BehaviorSubject<number>(0)
  private readonly connection$ = new BehaviorSubject<TorConnection>(TorConnection.uninitialized)
  watchProgress (): Observable<number> { return this.progress$.asObservable() }
  watchConnection (): Observable<TorConnection> { return this.connection$.asObservable() }
  peekConnection (): TorConnection { return this.connection$.getValue() }
  started: Subscription

  constructor (
    private readonly platform: Platform,
    private readonly networkMonitor: NetworkMonitor,
  ) { }

  init (): void {
    this.networkMonitor.watchConnection().subscribe(n => this.handleNetworkChange(n))
  }

  handleNetworkChange (network: NetworkStatus): void {
    if (network.connected) {
      this.start()
    } else {
      // if connected, disconnect
      if (this.connection$.getValue() === TorConnection.connected) {
        this.connection$.next(TorConnection.disconnected)
      }
    }
  }

  async start (): Promise<void> {
    // ** MOCKS **
    // return this.mock()

    if (!this.platform.is('ios') && !this.platform.is('android')) { return }

    if (!this.started) {
      console.log('starting Tor')
      this.connection$.next(TorConnection.in_progress)

      this.started = this.tor.start({ socksPort: TorService.PORT, initTimeout: 20000 }).subscribe({
        next: (progress: number) => this.handleConnecting(progress),
        error: (err: string) => {
          this.connection$.next(TorConnection.disconnected)
          throw new Error(`Error connecting to Tor: ${err}`)
        },
      })
    } else {
      console.log('reconnecting Tor')
      this.connection$.next(TorConnection.reconnecting)
      try {
        await this.tor.reconnect()
        this.connection$.next(TorConnection.connected)
      } catch (e) {
        this.connection$.next(TorConnection.disconnected)
      }
    }
  }

  private handleConnecting (progress: number) {
    this.progress$.next(progress)
    if (progress === 100) { this.connection$.next(TorConnection.connected) }
  }

  async mock (): Promise<void> {
    console.log('starting Tor')
    this.connection$.next(TorConnection.in_progress)
    setTimeout(() => { this.progress$.next(25) }, 1500)
    setTimeout(() => { this.progress$.next(40) }, 2000)
    setTimeout(() => { this.progress$.next(60) }, 3000)
    setTimeout(() => { this.progress$.next(90) }, 4500)
    setTimeout(() => {
      this.progress$.next(100)
      this.connection$.next(TorConnection.connected)
    }, 5500)
  }
}

export enum TorConnection {
  uninitialized = 'uninitialized',
  in_progress = 'in_progress',
  connected = 'connected',
  disconnected = 'disconnected',
  reconnecting = 'reconnecting',
}
