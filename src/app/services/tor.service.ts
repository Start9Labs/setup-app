import { Injectable } from '@angular/core'
import { Tor } from 'capacitor-tor'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class TorService {
  private readonly tor = new Tor()
  progress$ = new BehaviorSubject<number>(0)

  async init (): Promise<void> {
    // this.torClient.initTor().subscribe(progress => {
    //   this.progress$.next(progress)
    //   if (progress === 1) { this.progress$.complete() }
    // })

    this.tor.initTor()
    setTimeout(() => { this.progress$.next(.25) }, 1500)
    setTimeout(() => { this.progress$.next(.4) }, 2000)
    setTimeout(() => { this.progress$.next(.6) }, 3000)
    setTimeout(() => { this.progress$.next(.9) }, 4500)
    setTimeout(() => { this.progress$.next(1); this.progress$.complete() }, 5500)
  }
}
