import { Component, NgZone } from '@angular/core'
import { NavController, LoadingController } from '@ionic/angular'
import { ServerModel, ServerStatus, EmbassyConnection, S9Server, ConnectionPreference } from 'src/app/models/server-model'
import { SetupService, EmbassyBuilder, toS9Server } from 'src/app/services/setup.service'
import { ZeroconfMonitor } from 'src/app/services/zeroconf.service'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'
import { TorService, TorConnection } from 'src/app/services/tor.service'
import { Store } from 'src/app/store'

@Component({
  selector: 'setup',
  templateUrl: 'setup.page.html',
  styleUrls: ['setup.page.scss'],
})
export class SetupPage {
  error = ''
  productKey = ''
  host = ''
  existsSub: Subscription
  serviceExists = false
  segmentValue: 'basic' | 'advanced' = 'basic'

  constructor (
    private readonly navController: NavController,
    private readonly setupService: SetupService,
    private readonly serverModel: ServerModel,
    private readonly syncService: SyncService,
    private readonly torService: TorService,
    private readonly loadingCtrl: LoadingController,
    private readonly zeroconfMonitor: ZeroconfMonitor,
    private readonly store: Store,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    this.existsSub = this.zeroconfMonitor.watchServiceExists().subscribe(e => {
      this.zone.run(() => { this.serviceExists = e })
    })
  }

  ngOnDestroy () {
    this.existsSub.unsubscribe()
  }

  segmentChanged (e: Event): void {
    this.error = ''
  }

  async connect (advanced = false): Promise<void> {
    let host: string
    if (advanced) {
      host = this.sanitizeHost()
      if (!this.validateHost(host)) { return }
    }

    const loader = await this.loadingCtrl.create({
      message: 'Connecting',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    this.error = ''

    // if Tor and Tor not connected
    if (advanced && host && host.endsWith('.onion') && this.torService.peekConnection() !== TorConnection.connected) {
      await this.store.toggleTor(true)
      this.torService.start()
      const connectionSub = this.torService.watchConnection().subscribe(async c => {
        if (c === TorConnection.in_progress) {
          return
        } else {
          connectionSub.unsubscribe()
          if (c === TorConnection.connected) {
            await this.makeConnection(loader, host)
          } else {
            this.error = 'Error connecting to Tor'
            await loader.dismiss()
          }
        }
      })
    } else {
      this.makeConnection(loader, host)
    }
  }

  private async makeConnection (loader: HTMLIonLoadingElement, host: string): Promise<void> {
    try {
      let server: S9Server
      // **** Mocks ****
      // server = toS9Server(mockServer)
      // comment entire if/else block if mocks enabled
      if (host) {
        if (host.endsWith('.onion')) {
          server = await this.setupService.setupTor(host, this.productKey)
        } else {
          server = await this.setupService.setupIP(host, this.productKey)
        }
      } else {
        server = await this.setupService.setupZeroconf(this.productKey)
      }
      this.serverModel.createServer(server)
      await this.serverModel.saveAll()
      this.syncService.sync(server.id)
      await this.navController.navigateRoot(['/auth'])
    } catch (e) {
      console.error(e)
      this.error = `Error: ${e.message}`
    } finally {
      await loader.dismiss()
    }
  }

  private sanitizeHost (): string {
    let host = this.host
    host = host.trim()
    if (host.startsWith('http://')) {
      host = host.substr(7)
    }
    if (host.startsWith('https://')) {
      host = host.substr(8)
    }
    if (host.endsWith('/')) {
      host = host.substring(0, host.length - 1)
    }
    return host
  }

  private validateHost (host: string): boolean {
    // Tor
    if (host.endsWith('.onion')) {
      if (host.length !== 62) {
        this.error = 'Invalid Tor Address'
        return false
      }
    }
    // else {
    //   if (!RegExp(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/).test(host)) {
    //     this.error = 'Invalid IP address'
    //     return false
    //   }
    // }
    return true
  }
}

const mockServer: Required<EmbassyBuilder> = {
  id: '12345678',
  label: 'home',
  torAddress: 'agent-tor-address-isaverylongaddresssothaticantestwrapping.onion',
  staticIP: '',
  versionInstalled: '0.1.0',
  status: ServerStatus.RUNNING,
  privkey: 'testprivkey',
  connectionType: EmbassyConnection.LAN,
  connectionPreference: ConnectionPreference.LAN_TOR,
}
