import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Start9ServerPlus } from 'src/types/misc'
import { Start9Server } from 'src/types/Start9Server'
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx'
import { Storage } from '@ionic/storage'
import { S9Server, Start9Server, StorableS9Server } from './types'


@Injectable()
export class ServerModel {
  secure: SecureStorageObject
  servers: S9ServerCache = { }

  constructor (
    public platform: Platform,
    public secureStorage: SecureStorage,
    public storage: Storage,
  ) { }

  async load (): Promise<S9ServerCache> {
    if (this.platform.is('cordova')) {
      this.secure = await this.secureStorage.create('start9')
      this.servers = JSON.parse(await this.secure.get('servers').catch((e: Error) => '[]'))
    } else {
      this.servers = await this.storage.get('servers') || { }
    }
  }

  getServer (ssid: string): Start9Server | undefined {
    return this.servers[ssid]
  }

  getServers (): Start9Server[] {
    return Object.values(this.servers).filter(x => !!x)
  }

  getServerCount (): number {
    return this.getServers().length
  }

  getServerBy (filter: Partial<Start9Server>): Start9Server | undefined {
    return this.getServers().find(s =>
      Object.entries(filter).every(e => s[e[0]] === e[1]),
    )
  }

  async saveServer (server: Start9Server): Promise<void> {
    const clone: Start9Server = JSON.parse(JSON.stringify(server))
    delete clone.connected
    this.servers[server.id] = clone
    await this.saveAll()
  }

  async forgetServer (ssid: string): Promise<void> {
    delete this.servers[ssid]
    await this.saveAll()
  }

  private async saveAll (): Promise<void> {
    if (this.platform.is('cordova')) {
      await this.secure.set('servers', JSON.stringify(this.servers))
    } else {
      await this.storage.set('servers', this.servers)
    }
  }
}

type S9ServerCache =  { [id: string]: S9Server }
type ServerStore = StorableS9Server[]
