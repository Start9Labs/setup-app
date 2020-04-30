import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { Observable, Subject, Subscription, BehaviorSubject } from 'rxjs'
import { NetworkService } from './network.service'
import { NetworkStatus } from '@capacitor/core'
import { Platform } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class TorService {
  private readonly tor = new Tor()
  private readonly progress$ = new Subject<number>()
  private readonly connection$ = new BehaviorSubject<TorConnection>(TorConnection.uninitialized)
  watchProgress (): Observable<number> { return this.progress$ }
  watchConnection (): Observable<TorConnection> { return this.connection$ }
  private daemon: Subscription | undefined

  constructor (
    private readonly platform: Platform,
    private readonly networkService: NetworkService,
  ) { }

  init () {
    this.networkService.watch().subscribe(n => this.handleNetworkChange(n))
  }

  handleNetworkChange (network: NetworkStatus): void {
    if (network.connected) {
      this.start()
    } else {
      this.stop()
    }
  }

  async start (): Promise<void> {
    // return this.mock()

    if (this.daemon || !this.platform.is('cordova')) { return }

    console.log('starting Tor')

    this.connection$.next(TorConnection.in_progress)

    this.daemon = this.tor.initTor().subscribe(progress => {
      this.progress$.next(progress)
      if (progress === 1) { this.connection$.next(TorConnection.connected) }
    })
  }

  async stop (): Promise<void> {
    if (!this.daemon) { return }

    console.log('stopping Tor')
    // await this.tor.stopTor()
    this.connection$.next(TorConnection.disconnected)
    this.progress$.next(0)
  }

  async mock (): Promise<void> {
    this.connection$.next(TorConnection.in_progress)
    setTimeout(() => { this.progress$.next(.25) }, 1500)
    setTimeout(() => { this.progress$.next(.4) }, 2000)
    setTimeout(() => { this.progress$.next(.6) }, 3000)
    setTimeout(() => { this.progress$.next(.9) }, 4500)
    setTimeout(() => { this.progress$.next(1); this.connection$.next(TorConnection.connected) }, 5500)
  }
}

export enum TorConnection {
  uninitialized = 'uninitialized',
  in_progress = 'in_progress',
  connected = 'connected',
  disconnected = 'disconnected',
}
