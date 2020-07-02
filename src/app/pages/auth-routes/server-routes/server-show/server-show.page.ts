import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerStatus } from 'src/app/models/server-model'
import { NavController, AlertController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { AppInstalled } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ApiService } from 'src/app/services/api.service'
import { SyncService } from 'src/app/services/sync.service'
import { Subscription, BehaviorSubject, Observable } from 'rxjs'
import { take } from 'rxjs/operators'
import * as Menu from './server-menu-options'
import { ServerAppModel } from 'src/app/models/server-app-model'
import { PropertySubject, PropertyObservableWithId, peekProperties, fromPropertyObservable } from 'src/app/util/property-subject.util'
import { doForAtLeast, getIcon } from 'src/app/util/misc.util'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error = ''
  loading$ = new BehaviorSubject(true)
  versionLatest: string | undefined
  compareVersions = compareVersions
  s9Host$: Observable<string>

  server: PropertySubject<S9Server>
  apps: PropertyObservableWithId<AppInstalled>[]

  serverId: string

  addAppsSubscription: Subscription
  deleteAppsSubscription: Subscription
  versionLatestSubscription: Subscription | undefined // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
  statusSub: Subscription
  getIcon = getIcon
  updatingFreeze = false
  updating = false
  segmentValue: 'apps' | 'embassy' = 'apps'

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly apiService: ApiService,
    private readonly syncService: SyncService,
    readonly serverAppModel: ServerAppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server = this.serverModel.watchServerProperties(this.serverId)
    // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
    this.versionLatestSubscription = this.server.versionLatest.subscribe((versionLatest) => {
      this.versionLatest = versionLatest
    })
    // --end
    this.serverModel.createServerAppCache(this.serverId)

    const appModel = this.serverAppModel.get(this.serverId)

    this.apps = appModel.watchAll()

    this.statusSub = this.server.status.subscribe(status => {
      if (status === ServerStatus.UPDATING) {
        this.updating = true
      } else {
        if (!this.updatingFreeze) { this.updating = false }
      }
    })

    this.addAppsSubscription = appModel.watchAppAdds().subscribe(newAppObservables => {
      this.apps.push(...newAppObservables)
    })

    this.deleteAppsSubscription = appModel.watchAppDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.apps.findIndex(a => a.id === id)
        this.apps.splice(i, 1)
      })
    })

    await this.getServerAndApps()
    this.loading$.next(false)
  }

  ngOnDestroy () {
    this.addAppsSubscription.unsubscribe()
    this.deleteAppsSubscription.unsubscribe()
    this.statusSub.unsubscribe()
    if (this.versionLatestSubscription) { this.versionLatestSubscription.unsubscribe() } // @COMPAT 0.1.1 - versionLatest dropped in 0.1.2
  }

  async doRefresh (event: any) {
    await doForAtLeast([this.getServerAndApps()], 600)
    event.target.complete()
  }

  async getServerAndApps (): Promise<void> {
    const server = peekProperties(this.server)
    try {
      await this.syncService.sync(server.id)
      this.error = ''
    } catch (e) {
      console.error(e)
      this.error = e.message
    }
  }

  async getVersionLatest (): Promise<void> {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {
      const loader = await this.loadingCtrl.create(Menu.LoadingSpinner('Checking for updates...'))
      await loader.present()

      try {
        const { versionLatest } = await this.apiService.getVersionLatest(server.id)
        this.versionLatest = versionLatest
      } catch (e) {
        console.error(e)
        this.error = e.message
      } finally {
        await loader.dismiss()
      }
    })
  }

  async presentAlertEditName () {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {

      const alert = await this.alertCtrl.create(
        Menu.EditNameAlert(server, (data: { inputValue: string }) => {
          const inputValue = data.inputValue
          if (server.label === inputValue) { return } // return if no change
          if (!inputValue) {                          // throw error if no server name
            alert.message = 'Embassy must have a name'
            return false
          }
          this.serverModel.updateServer(server.id, { label: inputValue })
          this.serverModel.saveAll()
        }))

      await alert.present()
    })
  }

  async presentAlertUpdate () {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {
      const alert = await this.alertCtrl.create(
        Menu.UpdateAlert(server, this.versionLatest!, () => this.update(server)),
      )
      await alert.present()
    })
  }

  async presentAlertRestart () {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {
      const alert = await this.alertCtrl.create(
        Menu.RestartAlert(server, () => this.restart(server)),
      )
      await alert.present()
    })
  }

  async presentAlertShutdown () {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {
      const alert = await this.alertCtrl.create(
        Menu.ShutdownAlert(server, () => this.shutdown(server)),
      )
      await alert.present()
    })
  }

  async presentAlertForget () {
    fromPropertyObservable(this.server).pipe(take(1)).subscribe(async server => {
      const alert = await this.alertCtrl.create(
        Menu.ForgetAlert(server, () => this.forget(server)),
      )
      await alert.present()
    })
  }

  async update (server: S9Server) {
    const loader = await this.loadingCtrl.create(Menu.LoadingSpinner())
    await loader.present()

    try {
      await this.apiService.updateAgent(server.id, this.versionLatest!)
      this.serverModel.updateServer(server.id, { status: ServerStatus.UPDATING })
      // hides the "Update Ambassador to..." button for this intance of the component
      this.updatingFreeze = true
      this.updating = true
      setTimeout(() => this.updatingFreeze = false, 8000)
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async restart (server: S9Server) {
    const loader = await this.loadingCtrl.create(
      Menu.LoadingSpinner(`Restarting ${server.label}...`),
    )
    await loader.present()

    try {
      await this.apiService.restartServer(server.id)
      await this.navCtrl.pop()
    } catch (e) {
      console.error(e)
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async shutdown (server: S9Server) {
    const loader = await this.loadingCtrl.create(
      Menu.LoadingSpinner(`Shutting down ${server.label}...`),
    )
    await loader.present()

    try {
      await this.apiService.shutdownServer(server.id)
      await this.navCtrl.pop()
    } catch (e) {
      console.error(e)
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async forget (server: S9Server) {
    this.serverModel.removeServer(server.id)
    this.serverModel.saveAll()
    await this.navCtrl.navigateRoot(['/auth'])
  }
}