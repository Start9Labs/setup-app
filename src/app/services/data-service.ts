import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Start9Server } from 'src/types/misc'
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx'
import { Storage } from '@ionic/storage'

@Injectable()
export class DataService  {
  secure: SecureStorageObject
  servers: Start9Server[] = []

  constructor (
    public platform: Platform,
    public secureStorage: SecureStorage,
    public storage: Storage,
  ) { }

  async load (): Promise<void> {
    if (this.platform.is('cordova')) {
      this.secure = await this.secureStorage.create('start9')
      this.servers = JSON.parse(await this.secure.get('servers').catch((e: Error) => '[]'))
    } else {
      this.servers = await this.storage.get('servers') || []
    }
  }

  getServer (zeroconfHostname: string) {
    return this.servers.find(server => server.zeroconfHostname === zeroconfHostname)
  }

  async saveServer (server: Start9Server): Promise<void> {
    const clone: Start9Server = JSON.parse(JSON.stringify(server))
    delete clone.connected
    const index = this.servers.findIndex(s => s.zeroconfHostname === server.zeroconfHostname)
    if (index === -1) {
      this.servers.push(clone)
    } else {
      this.servers[index] = clone
    }
    await this.saveAll()
  }

  async forgetServer (zeroconfHostname: string): Promise<void> {
    const index = this.servers.findIndex(s => s.zeroconfHostname === zeroconfHostname)
    this.servers.splice(index)
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
