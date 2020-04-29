import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { BehaviorSubject, Observable } from 'rxjs'
import { NetworkService } from './network.service'
import { NetworkStatus } from '@capacitor/core'

@Injectable({
  providedIn: 'root',
})
export class TorService {
  private readonly tor = new Tor()
  private readonly progress$ = new BehaviorSubject<number>(0)
  private readonly connection$ = new BehaviorSubject<TorConnection>(TorConnection.uninitialized)
  watchProgress (): Observable<number> { return this.progress$ }
  watchConnection (): Observable<TorConnection> { return this.connection$ }

  constructor (
    private readonly networkService: NetworkService,
  ) { }

  init () {
    this.networkService.watch().subscribe(s => this.handleNetworkStatusChange(s))
  }

  handleNetworkStatusChange (status: NetworkStatus['connectionType']): void {
    if (status === 'none') {
      this.stop()
    } else {
      this.start()
    }
  }

  async start (): Promise<void> {
    console.log('starting Tor')
    this.progress$.next(.001)
    this.connection$.next(TorConnection.in_progress)
    return this.mock()

    await this.tor.initTor()
    this.tor.initProgress.subscribe(progress => {
      this.progress$.next(progress)
      if (progress === 1) {
        this.connection$.next(TorConnection.connected)
        setTimeout(() => this.progress$.next(0), 500)
      }
    })
  }

  async stop (): Promise<void> {
    console.log('stopping Tor')
    // await this.tor.stopTor()
    this.connection$.next(TorConnection.disconnected)
  }

  async mock (): Promise<void> {
    setTimeout(() => { this.progress$.next(.25) }, 1500)
    setTimeout(() => { this.progress$.next(.4) }, 2000)
    setTimeout(() => { this.progress$.next(.6) }, 3000)
    setTimeout(() => { this.progress$.next(.9) }, 4500)
    setTimeout(() => { this.progress$.next(1); this.connection$.next(TorConnection.connected) }, 5500)
    setTimeout(() => { this.progress$.next(0) }, 6000)
  }
}

export enum TorConnection {
  uninitialized = 'uninitialized',
  in_progress = 'in_progress',
  connected = 'connected',
  disconnected = 'disconnected',
}
