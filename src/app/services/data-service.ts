import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Start9Server, getServerName } from 'src/types/misc'
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx'
import { Storage } from '@ionic/storage'
import { isUndefined } from 'util';

@Injectable()
export class DataService {
  secure: SecureStorageObject
  servers: { [ssid: string]: Start9Server } = {}

  constructor(
    public platform: Platform,
    public secureStorage: SecureStorage,
    public storage: Storage,
  ) { }

  async load(): Promise<void> {
    if (this.platform.is('cordova')) {
      this.secure = await this.secureStorage.create('start9')
      this.servers = JSON.parse(await this.secure.get('servers').catch((e: Error) => '[]'))
    } else {
      this.servers = await this.storage.get('servers') || []
    }
  }

  getServer(ssid: string): Start9Server | undefined {
    return this.servers[ssid]
  }

  getServers(): Start9Server[] {
    return Object.values(this.servers).filter(x => !!x)
  }

  getServerCount(): number {
    return this.getServers().length
  }

  getServerFromLANHost(zeroconfHostName: string): Start9Server | undefined {
    return this.getServer(ssidFromZeroConfHostName(zeroconfHostName))
  }

  async saveServer(server: Start9Server): Promise<void> {
    const clone: Start9Server = JSON.parse(JSON.stringify(server))
    delete clone.connected
    this.servers[server.ssid] = clone
    await this.saveAll()
  }

  async forgetServer(ssid: string): Promise<void> {
    delete this.servers[ssid]
    await this.saveAll()
  }

  private async saveAll(): Promise<void> {
    if (this.platform.is('cordova')) {
      await this.secure.set('servers', JSON.stringify(this.servers))
    } else {
      await this.storage.set('servers', this.servers)
    }
  }
}

function ssidFromZeroConfHostName(hostName: string): string {
  return hostName.replace('.local', '')
}
