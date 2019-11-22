import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { S9ServerStorable, toStorableServer, fromStorableServer, S9Server } from './s9-server'
import { InstalledApp, AvailableAppPreview } from './s9-app'
import { fromObject, toDedupObject } from '../util/misc.util'
import { AuthService } from '../services/auth.service'

@Injectable({
  providedIn: 'root',
})
export class S9ServerModel {
  servers: S9Server[] = []

  constructor (
    private readonly storage: Storage,
    private readonly authService: AuthService,
  ) {
    this.authService.authState.subscribe(isAuthed => {
      if (isAuthed) {
        return
      } else {
        this.servers = []
      }
    })
  }

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    this.servers = fromStorage.map(s => fromStorableServer(s, mnemonic))
  }

  getServer (id: string): S9Server | undefined {
    return this.servers.find(s => s.id === id)
  }

  getServerCount (): number {
    return this.servers.length
  }

  async addApp (server: S9Server, app: InstalledApp) {
    const serverClone = clone(server)
    serverClone.apps.push(app)
    const index = this.servers.findIndex(s => s.id === server.id)
    this.servers.splice(index, 1, serverClone)
    await this.saveAll()
  }

  async removeApp (server: S9Server, app: AvailableAppPreview) {
    const serverClone = clone(server)
    const index = serverClone.apps.findIndex(a => a.id === app.id)
    serverClone.apps.splice(index, 1)
    await this.saveServer(serverClone)
  }

  async reCacheServer (server: S9Server): Promise<void> {
    let ser = this.servers.find(s => s.id === server.id) as S9Server

    Object.keys(server).forEach(key => {
      ser![key] = server[key]
    })
  }

  async saveServer (server: S9Server): Promise<void> {
    this.reCacheServer(server)
    await this.saveAll()
  }

  async forgetServer (id: string): Promise<void> {
    this.servers.filter(s => s.id !== id)
    await this.saveAll()
  }

  private async saveAll (): Promise<void> {
    await this.storage.set('servers', this.servers.map(toStorableServer))
  }
}

export function clone<T extends { }> (t: T): T {
  return JSON.parse(JSON.stringify(t))
}

type S9ServerStore = S9ServerStorable[]
