import { Component, NgZone } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'
import { PropertyObservableWithId } from 'src/app/util/property-subject.util'
import { TorService, TorConnection } from 'src/app/services/tor.service'
import { animate, style, transition, trigger } from '@angular/animations'
import { doForAtLeast } from 'src/app/util/misc.util'
import { Store } from 'src/app/store'

const torAnimation = trigger(
  'torChange',
  [
    transition(
      ':enter',
      [
        style({ transform: 'translateY(-100%)' }),
        animate('.2s ease-in', style({ transform: 'translateY(0%)' })),
      ],
    ),
    transition(
      ':leave',
      [
        animate('.2s ease-out', style({ transform: 'translateY(-100%)' })),
      ],
    ),
  ],
)

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
  animations: [torAnimation],
})
export class ServerListPage {
  servers: PropertyObservableWithId<S9Server>[] = []
  addServersSubscription: Subscription
  deleteServersSubscription: Subscription
  progressSub: Subscription
  torStatusSub: Subscription
  torStatus: TorConnection
  progress: number

  constructor (
    private readonly serverModel: ServerModel,
    private readonly torService: TorService,
    private readonly syncService: SyncService,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
    private readonly store: Store,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAll()

    this.torStatusSub = this.torService.watchConnection().subscribe(c => {
      this.zone.run(() => {
        this.torStatus = c
      })
    })

    this.progressSub = this.torService.watchProgress().subscribe(p => {
      this.zone.run(() => {
        this.progress = p / 100
      })
    })

    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      this.servers.push(...newServers)
    })

    this.deleteServersSubscription = this.serverModel.watchServerDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.servers.findIndex(s => s.id === id)
        this.servers.splice(i, 1)
      })
    })

    console.log(this.servers, this.servers.length, this.store.torEnabled, this.store.showTorPrompt)

    setTimeout(() => {
      if (this.servers.length && !this.store.torEnabled && this.store.showTorPrompt) {
        this.store.showTorPrompt = false
        this.presentAlertEnableTor()
      }
    }, 1000)
  }

  ngOnDestroy () {
    this.torStatusSub.unsubscribe()
    this.progressSub.unsubscribe()
    this.addServersSubscription.unsubscribe()
    this.deleteServersSubscription.unsubscribe()
  }

  async doRefresh (event: any) {
    await doForAtLeast([this.syncService.syncAll()], 600)
    event.target.complete()
  }

  async show (id: string) {
    await this.navCtrl.navigateForward(['/auth', 'servers', id])
  }

  private async presentAlertEnableTor () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Tor Feature',
      message: 'Enable Tor in the settings menu to connect privately and securely with your Embassies outside your home network',
      inputs: [
        {
          name: 'checkbox',
          type: 'checkbox',
          label: `Don't show again`,
          value: 'true',
          checked: false,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Go to settings',
          handler: (data: string[]) => {
            if (data[0]) {
              this.store.hideTorPrompt()
            }
            this.navCtrl.navigateForward(['/auth/settings'])
          },
        },
      ],
    })
    await alert.present()
  }
}
