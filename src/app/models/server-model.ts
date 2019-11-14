import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { S9ServerStorable, toStorableServer, fromStorableServer, S9Server } from './s9-server'
import { InstalledApp, AvailableApp } from './s9-app'
import { fromObject, toDedupObject } from '../util/misc.util'
import { deriveKeys } from '../util/crypto.util'
import { AuthService } from '../services/auth.service'

@Injectable({
  providedIn: 'root',
})
export class S9ServerModel {
  servers: S9ServerCache = { }

  constructor (
    private readonly storage: Storage,
    private readonly authService: AuthService,
  ) {
    this.authService.authState.subscribe(isAuthed => {
      if (isAuthed) {
        return
      } else {
        this.servers = { }
      }
    })
  }

  async load (mnemonic: string[]): Promise<void> {
    this.servers = toServerCache(await this.storage.get('servers') || [], mnemonic)
  }

  getServer (id: string): S9Server | undefined {
    return this.servers[id]
  }

  getServers (): S9Server[] {
    return Object.values(this.servers).filter(x => !!x)
  }

  getServerCount (): number {
    return this.getServers().length
  }

  getServerBy (filter: Partial<S9Server>): S9Server | undefined {
    return this.getServers().find(s =>
      Object.entries(filter).every(e => s[e[0]] === e[1]),
    )
  }

  async addApps (server: S9Server, apps: InstalledApp[]) {
    const serverClone = clone(server)
    serverClone.apps = serverClone.apps.concat(apps)
    this.servers[server.id] = serverClone
    await this.saveAll()
  }

  async updateApps (server: S9Server, installedApps: InstalledApp[]) {
    const serverClone = clone(server)
    const serverApps = toDedupObject(serverClone.apps, installedApps, a => a.id)
    this.servers[server.id] = { ...serverClone, apps: fromObject(serverApps) }
    await this.saveAll()
  }

  async removeApp (server: S9Server, app: AvailableApp) {
    const serverClone = clone(server)
    const newApps = serverClone.apps.filter(a => a.id !== app.id)
    serverClone.apps = newApps
    this.servers[server.id] = serverClone
    await this.saveAll()
  }

  async saveServer (server: S9Server): Promise<void> {
    this.servers[server.id] = clone(server)
    await this.saveAll()
  }

  async forgetServer (id: string): Promise<void> {
    delete this.servers[id]
    await this.saveAll()
  }

  private async saveAll (): Promise<void> {
    const storableServers = fromServerCache(this.servers)
    await this.storage.set('servers', storableServers)
  }
}

export function clone<T extends { }> (t: T): T {
  return JSON.parse(JSON.stringify(t))
}

function fromServerCache (sc : S9ServerCache): S9ServerStore {
  return Object.values(sc).map(toStorableServer)
}

function toServerCache (ss : S9ServerStore, mnemonic: string[]): S9ServerCache {
  return ss.reduce((acc, next) => {
    const { privkey, pubkey } = deriveKeys(mnemonic, next.torAddress)
    acc[next.id] = fromStorableServer(next, privkey)
    return acc
  }, { } as S9ServerCache)
}

type S9ServerCache =  { [id: string]: S9Server }
type S9ServerStore = S9ServerStorable[]
