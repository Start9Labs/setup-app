import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { S9ServerStorable, toStorableServer, fromStorableServer, S9Server } from './s9-server'
import { AppInstalled } from './s9-app'
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

  // SERVERS

  async load (mnemonic: string[]): Promise<void> {
    const fromStorage: S9ServerStore = await this.storage.get('servers') || []
    this.servers = fromStorage.map(s => fromStorableServer(s, mnemonic))
  }

  getServer (id: string): S9Server | undefined {
    return this.servers.find(s => s.id === id)
  }

  cacheServer (server: S9Server, upsert = true): void {
    const target = this.getServer(server.id)

    if (target) {
      Object.keys(server).forEach(key => {
        if (!Array.isArray(server[key])) {
          target[key] = server[key]
        }
      })
    } else if (!target && upsert) {
      this.servers.push(server)
    }
  }

  async createServer (server: S9Server): Promise<void> {
    this.cacheServer(server)
    await this.saveAll()
  }

  async updateServer (server: S9Server): Promise<void> {
    this.cacheServer(server, false)
    await this.saveAll()
  }

  async forgetServer (id: string): Promise<void> {
    const index = this.servers.findIndex(s => s.id === id)
    if (index > -1) {
      this.servers.splice(index, 1)
      await this.saveAll()
    }
  }

  private async saveAll (): Promise<void> {
    await this.storage.set('servers', this.servers.map(toStorableServer))
  }

  // APPS

  cacheApp (serverId: string, app: AppInstalled) {
    const server = this.getServer(serverId)
    if (!server) { return }

    const existing = server.apps.find(a => a.id === app.id)
    if (existing) {
      Object.keys(app).forEach(key => {
        existing[key] = app[key]
      })
    } else {
      server.apps.push(app)
    }
  }

  async removeApp (serverId: string, appId: string) {
    const server = this.getServer(serverId)
    if (!server) { return }

    const index = server.apps.findIndex(a => a.id === appId)
    server.apps.splice(index, 1)
  }
}

type S9ServerStore = S9ServerStorable[]
