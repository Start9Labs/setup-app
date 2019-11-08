import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { S9Server, StorableS9Server, toStorableServer, fromStorableServer } from './s9-server'

@Injectable()
export class S9ServerModel {
  servers: S9ServerCache = { }

  constructor (
    private readonly storage: Storage,
  ) { }

  async load (): Promise<void> {
    this.servers = toServerCache(await this.storage.get('servers') || [])
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

function toServerCache (ss : S9ServerStore): S9ServerCache {
  return ss.reduce((acc, next) => {
    acc[next.id] = fromStorableServer(next)
    return acc
  }, { } as S9ServerCache)
}

type S9ServerCache =  { [id: string]: S9Server }
type S9ServerStore = StorableS9Server[]
