import { Injectable } from '@angular/core'
import { CanActivate } from '@angular/router'
import { Store } from './store'
import { NavController } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class RouterGuard implements CanActivate {
  constructor (
    private readonly navCtrl: NavController,
    private readonly store: Store,
  ) { }

  canActivate (): boolean {
    if (this.store.peekDevices().length) {
      return true
    } else {
      this.navCtrl.navigateRoot(['/connect'])
      return false
    }
  }
}
