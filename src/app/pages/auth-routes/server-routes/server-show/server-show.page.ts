import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerStatus } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { ActionSheetButton } from '@ionic/core'
import { AppInstalled } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Observable, forkJoin, interval, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import * as Menu from './server-menu-options'
import { ServerAppModel } from 'src/app/models/server-app-model'
import { PropertySubject, PropertyObservableWithId, peekProperties, fromPropertyObservable } from 'src/app/util/property-subject.util'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error = ''
  view: 'apps' | 'about' = 'apps'
  loading = true
  versionLatest: string | undefined
  compareVersions = compareVersions

  server: PropertySubject<S9Server>
  apps: PropertyObservableWithId<AppInstalled>[]

  serverId: string

  addAppsSubscription: Subscription
  deleteAppsSubscription: Subscription

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly sss: ServerSyncService,
    readonly serverAppModel: ServerAppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server = this.serverModel.watchServerProperties(this.serverId)
    this.serverModel.createServerAppCache(this.serverId)

    const appModel = this.serverAppModel.get(this.serverId)

    this.apps = appModel.watchAll()

    this.addAppsSubscription = appModel.watchAppAdds().subscribe(newAppObservables => {
      this.apps.push(...newAppObservables)
    })

    this.deleteAppsSubscription = appModel.watchAppDeletes().subscribe(deletedIds => {
      deletedIds.forEach(id => {
        const i = this.apps.findIndex(a => a.id === id)
        this.apps.splice(i, 1)
      })
    })

    await Promise.all([this.getServerAndApps(), pauseFor(600)])
    this.loading = false
  }

  ngOnDestroy () {
    this.addAppsSubscription.unsubscribe()
    this.deleteAppsSubscription.unsubscribe()
  }

  async doRefresh (event: any) {
    await this.getServerAndApps()
    event.target.complete()
  }

  async getServerAndApps (): Promise<void> {
    const server = peekProperties(this.server)
    try {
      await this.sss.fromCache().syncServer(server)
      this.error = ''
    } catch (e) {
      this.error = e.message
    }
  }

  async presentAction (pittedServer: PropertySubject<S9Server>) {
    fromPropertyObservable(pittedServer).pipe(take(1)).subscribe(async server => {
      const buttons: ActionSheetButton[] = [
        Menu.EditFriendlyName(() => this.presentAlertEditName(server)),
      ]

      if (server.status === ServerStatus.RUNNING) {
        buttons.push(
          Menu.Wifi(() => this.navigate(['wifi'])),
          Menu.ServerSpecs(() => this.navigate(['specs'])),
          Menu.Metrics(() => this.navigate(['metrics'])),
          Menu.DeveloperOptions(() => this.navigate(['developer-options'])),
          Menu.Restart(() => this.presentAlertRestart(server)),
          Menu.Shutdown(() => this.presentAlertShutdown(server)),
        )
      }

      buttons.push(
        Menu.Forget(() => this.presentAlertForget(server)),
      )

      const action = await this.actionCtrl.create({
        buttons,
      })

      await action.present()
    })
  }

  async getVersionLatest (server: S9Server): Promise<void> {
    const loader = await this.loadingCtrl.create(Menu.LoadingSpinner('Checking for updates...'))
    await loader.present()

    try {
      const { versionLatest } = await this.serverService.getVersionLatest(server.id)
      this.versionLatest = versionLatest
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async presentAlertEditName (server: S9Server) {
    const alert = await this.alertCtrl.create(
      Menu.EditFriendlyNameAlert(server, (data: { inputValue: string }) => {
        const inputValue = data.inputValue
        if (server.label === inputValue) { return } // return if no change
        if (!inputValue) {                          // throw error if no server name
          alert.message = 'Server must have a name'
          return false
        }
        this.serverModel.updateServer(this.serverId, { label: inputValue })
        this.serverModel.saveAll()
      }))

    await alert.present()
  }

  async presentAlertUpdate (propertiesSubject: PropertySubject<S9Server>) {
    fromPropertyObservable(propertiesSubject).pipe(take(1)).subscribe(async server => {
      const alert = await this.alertCtrl.create(
        Menu.UpdateAlert(server, this.versionLatest!, () => this.update(server)),
      )
      await alert.present()
    })
  }

  async presentAlertRestart (server: S9Server) {
    const alert = await this.alertCtrl.create(
      Menu.RestartAlert(server, () => this.restart(server)),
    )
    await alert.present()
  }

  async presentAlertShutdown (server: S9Server) {
    const alert = await this.alertCtrl.create(
      Menu.ShutdownAlert(server, () => this.shutdown(server)),
    )
    await alert.present()
  }

  async presentAlertForget (server: S9Server) {
    const alert = await this.alertCtrl.create(
      Menu.ForgetAlert(server, () => this.forget()),
    )
    await alert.present()
  }

  async update (server: S9Server) {
    const loader = await this.loadingCtrl.create(Menu.LoadingSpinner())
    await loader.present()

    try {
      await this.serverService.updateAgent(this.serverId, this.versionLatest!)
      this.serverModel.updateServer(this.serverId, { status: ServerStatus.UPDATING, statusAt: new Date().toISOString() })
    } catch (e) {
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
      await this.serverService.restartServer(this.serverId)
      await this.navCtrl.pop()
    } catch (e) {
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
      await this.serverService.shutdownServer(this.serverId)
      await this.navCtrl.pop()
    } catch (e) {
      this.error = e.mesasge
    } finally {
      await loader.dismiss()
    }
  }

  async forget () {
    await this.serverModel.removeServer(this.serverId)
    await this.serverModel.saveAll()
    await this.navCtrl.navigateRoot(['/auth'])
  }

  private async navigate (path: string[]): Promise<void> {
    await this.navCtrl.navigateForward(path, { relativeTo: this.route })
  }
}

type FiniteObservable<T> = Observable<T>

export const squash = map(() => { return })
export function forkPause (ms: number): FiniteObservable<void> {
  return interval(ms).pipe(take(1), squash)
}
export function forkDoAll (...os: Observable<any>[]): FiniteObservable<any[]> {
  return forkJoin(os.map(a => a.pipe(take(1))))
}