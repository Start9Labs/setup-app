import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { Observable, BehaviorSubject, Subscription } from 'rxjs'
import { NetworkMonitor } from './network.service'
import { NetworkStatus } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import { Store } from '../store'

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
  networkSub: Subscription
  private wasStopped = false

  constructor (
    private readonly platform: Platform,
    private readonly networkMonitor: NetworkMonitor,
    private readonly store: Store,
  ) { }

  initMonitors (): void {
    this.networkSub = this.networkSub || this.networkMonitor.watchConnection().subscribe(n => this.handleNetworkChange(n))
  }

  async start (): Promise<void> {
    // ** MOCKS **
    // return this.mock()

    if (!this.platform.is('ios') && !this.platform.is('android')) { return }
    if (await this.tor.isRunning()) { return }

    console.log('starting Tor')

    this.connection$.next(TorConnection.in_progress)

    let action: (opt?: { socksPort: number, initTimeout: number}) => Observable<number>
    if (this.platform.is('ios') && this.wasStopped) {
      action = this.tor.restart.bind(this)
    } else {
      action = this.tor.start.bind(this)
    }
    action({ socksPort: TorService.PORT, initTimeout: 40000 }).subscribe({
      next: (progress: number) => this.handleConnecting(progress),
      error: (err: string) => {
        this.connection$.next(TorConnection.disconnected)
        throw new Error(`Error connecting to Tor: ${err}`)
      },
    })
  }

  async stop (): Promise<void> {
    if (!this.platform.is('ios') && !this.platform.is('android')) { return }

    if (await this.tor.isRunning()) {
      console.log('stopping Tor')
      try {
        this.tor.stop()
        this.wasStopped = true
        this.progress$.next(0)
        this.connection$.next(TorConnection.disconnected)
      } catch (e) {
        console.log(`Tor stop failed: ${e}`)
      }
    }
  }

  private async restart (): Promise<void> {
    console.log('restarting Tor')
    await this.stop()
    this.start()
  }

  private async reconnect (): Promise<void> {
    if (!this.platform.is('ios') && !this.platform.is('android')) { return }

    console.log('reconnecting Tor')
    try {
      await this.tor.reconnect()
    } catch (e) {
      console.log(`Tor reconnect failed: ${e}`)
      await this.restart()
    }
  }

  private async handleNetworkChange (network: NetworkStatus): Promise<void> {
    // if connected to Internet, connect or reconnect to Tor
    if (network.connected && this.store.torEnabled) {
      if (this.platform.is('desktop')) { this.start(); return }

      if (await this.tor.isRunning()) {
        await this.reconnect()
      } else {
        await this.start()
      }
    }
  }

  private handleConnecting (progress: number) {
    this.progress$.next(progress)
    if (progress === 100) { this.connection$.next(TorConnection.connected) }
  }

  private mock (): void {
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
