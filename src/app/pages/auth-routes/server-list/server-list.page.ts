import { Component } from '@angular/core'
import { ServerModel, S9Server } from 'src/app/models/server-model'
import { NavController, AlertController } from '@ionic/angular'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription } from 'rxjs'
import { PropertyObservableWithId } from 'src/app/util/property-subject.util'
import { doForAtLeast } from 'src/app/util/misc.util'
import { Store } from 'src/app/store'

@Component({
  selector: 'page-server-list',
  templateUrl: './server-list.page.html',
  styleUrls: ['./server-list.page.scss'],
})
export class ServerListPage {
  servers: PropertyObservableWithId<S9Server>[] = []
  addServersSubscription: Subscription
  deleteServersSubscription: Subscription

  constructor (
    private readonly serverModel: ServerModel,
    private readonly syncService: SyncService,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
    private readonly store: Store,
  ) { }

  ngOnInit () {
    this.servers = this.serverModel.watchAll()

    this.addServersSubscription = this.serverModel.watchServerAdds().subscribe(newServers => {
      this.servers.push(...newServers)
    })

    this.deleteServersSubscription = this.serverModel.watchServerDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.servers.findIndex(s => s.id === id)
        this.servers.splice(i, 1)
      })
    })

    setTimeout(() => {
      if (this.servers.length && !this.store.torEnabled && this.store.showTorPrompt) {
        this.store.showTorPrompt = false
        this.presentAlertEnableTor()
      }
    }, 1000)
  }

  ngOnDestroy () {
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
