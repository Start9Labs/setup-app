import { Injectable } from '@angular/core'
import { AppModel } from './app-model'
import { AuthService, AuthStatus } from '../services/auth.service'
import { Subscription } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class ServerAppModel {
  lightCache: { [serverId: string]: AppModel } = { }
  authSub: Subscription

  constructor (
    private readonly authService: AuthService,
  ) { }

  initMonitors () {
    this.authSub = this.authSub || this.authService.watch().subscribe(status => this.handleAuthChange(status))
  }

  get (serverId: string): AppModel {
    this.create(serverId)
    return this.lightCache[serverId]
  }

  create (serverId: string): void {
    if (!this.lightCache[serverId]) {
      this.lightCache[serverId] = new AppModel(serverId)
    }
  }

  private remove (serverId: string): void {
    if (this.lightCache[serverId]) {
      this.lightCache[serverId].clear()
      delete this.lightCache[serverId]
    }
  }

  private clearCache (): void {
    Object.keys(this.lightCache).forEach(serverId => {
      this.remove(serverId)
    })
  }

  private handleAuthChange (status: AuthStatus): void {
    if (status === AuthStatus.MISSING) {
      this.clearCache()
    }
  }
}