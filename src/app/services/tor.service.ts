import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { Observable, BehaviorSubject } from 'rxjs'
import { NetworkMonitor } from './network.service'
import { NetworkStatus } from '@capacitor/core'
import { Platform } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class TorService {
  private readonly tor = new Tor()
  private readonly progress$ = new BehaviorSubject<number>(0)
  private readonly connection$ = new BehaviorSubject<TorConnection>(TorConnection.uninitialized)
  watchProgress (): Observable<number> { return this.progress$.asObservable() }
  watchConnection (): Observable<TorConnection> { return this.connection$.asObservable() }
  peekConnection (): TorConnection { return this.connection$.getValue() }
  initialized = false // @TODO delete when capacitor-tor is updated

  constructor (
    private readonly platform: Platform,
    private readonly networkMonitor: NetworkMonitor,
  ) { }

  init () {
    this.networkMonitor.watchConnection().subscribe(n => this.handleNetworkChange(n))
  }

  handleNetworkChange (network: NetworkStatus): void {
    if (network.connected) {
      this.start()
    } else {
      this.connection$.next(TorConnection.disconnected)
    }
  }

  async start (): Promise<void> {
    // return this.mock()

    if (!this.platform.is('cordova')) { return }

    // @TODO delete this entire block once capacitor-tor is updated
    if (!this.initialized) {
      console.log('starting Tor')
      this.connection$.next(TorConnection.in_progress)
      this.tor.initTor({ socksPort: 59590 }).subscribe(progress => {
        this.handleConnecting(progress)
      })
      this.initialized = true
    } else {
      this.connection$.next(TorConnection.connected)
    }

    // this.connection$.next(TorConnection.in_progress)
    // if (await !this.tor.running()) {
    //   console.log('starting Tor')
    //   this.tor.start({ socksPort: 59590 }).subscribe(progress => {
    //     this.handleConnecting(progress)
    //   })
    // } else {
    //   console.log('restarting Tor')
    //   this.tor.restart({ socksPort: 59590 }).subscribe(progress => {
    //     this.handleConnecting(progress)
    //   })
    // }
  }

  private handleConnecting (progress: number) {
    this.progress$.next(progress)
    if (progress === 100) {
      this.connection$.next(TorConnection.connected)
      this.progress$.next(0)
    }
  }

  async mock (): Promise<void> {
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
}
