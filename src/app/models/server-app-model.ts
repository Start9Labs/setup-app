import { Injectable } from '@angular/core'
import { AppInstalled, AppModel } from './app-model'

@Injectable({
  providedIn: 'root',
})
export class ServerAppModel {
  lightCache: { [serverId: string]: AppModel } = { }

  constructor () { }

  get (serverId: string): AppModel {
    this.create(serverId)
    return this.lightCache[serverId]
  }

  create (serverId: string): void {
    if (!this.lightCache[serverId]) {
      this.lightCache[serverId] = new AppModel(serverId)
      console.log('light cache made')
    }
  }

  remove (serverId: string): void {
    if (this.lightCache[serverId]) {
      this.lightCache[serverId].clear()
      delete this.lightCache[serverId]
    }
  }

  clearCache () {
    Object.keys(this.lightCache).forEach(serverId => {
      this.remove(serverId)
    })
  }
}