import { Injectable } from '@angular/core'
import { CanActivate } from '@angular/router'
import { AppState } from './app-state'
import { NavController } from '@ionic/angular'

@Injectable({
  providedIn: 'root',
})
export class RouterGuard implements CanActivate {
  constructor (
    private readonly navCtrl: NavController,
    private readonly appState: AppState,
  ) { }

  canActivate (): boolean {
    if (this.appState.peekDevices().length) {
      return true
    } else {
      this.navCtrl.navigateRoot(['/connect'])
      return false
    }
  }
}
