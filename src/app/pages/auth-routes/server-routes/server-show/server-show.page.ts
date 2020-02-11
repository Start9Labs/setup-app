import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ServerModel, ServerStatus } from 'src/app/models/server-model'
import { NavController, AlertController, ActionSheetController, LoadingController } from '@ionic/angular'
import { S9Server } from 'src/app/models/server-model'
import { ActionSheetButton } from '@ionic/core'
import { AppModel, AppInstalled } from 'src/app/models/app-model'
import * as compareVersions from 'compare-versions'
import { ServerService } from 'src/app/services/server.service'
import { ServerSyncService } from 'src/app/services/server.sync.service'
import { Observable, BehaviorSubject, forkJoin, interval } from 'rxjs'
import { mergeMap, map, take } from 'rxjs/operators'
import { EditFriendlyName, Wifi, ServerSpecs, Metrics, DeveloperOptions, Restart, Shutdown, Forget, EditFriendlyNameAlert, UpdateAlert, LoadingSpinner, RestartAlert, ShutdownAlert, ForgetAlert } from './server-menu-options'

@Component({
  selector: 'server-show',
  templateUrl: 'server-show.page.html',
  styleUrls: ['server-show.page.scss'],
})
export class ServerShowPage {
  error = ''
  view: 'apps' | 'about' = 'apps'
  loading = true
  compareVersions = compareVersions
  server$: BehaviorSubject<S9Server>
  serverId: string
  serverApps$: Observable<{ [appId: string]: BehaviorSubject<AppInstalled> }>

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly navCtrl: NavController,
    private readonly actionCtrl: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly serverService: ServerService,
    private readonly sss: ServerSyncService,
    readonly appModel: AppModel,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server$ = this.serverModel.watchServer(this.serverId)
    this.serverModel.createServerAppCache(this.serverId)
    this.serverApps$ = this.appModel.watchServerCache(this.serverId)

    forkDoAll(this.getServerAndApps(), forkPause(600)).pipe(squash).subscribe(() => {
        this.loading = false
    })
  }

  doRefresh (event: any) {
    this.getServerAndApps().subscribe(() => event.target.complete())
  }

  getServerAndApps(): FiniteObservable<void> {
    return this.server$.pipe(
      take(1),
      mergeMap(async server => {
        try {
          await this.sss.fromCache().syncServer(server)
          this.error = ''
        } catch (e) {
          this.error = e.message
        }
      })
    ) 
  }

  async presentAction (server: S9Server) {
    const buttons: ActionSheetButton[] = [
        EditFriendlyName  (() => this.presentAlertEditName())
    ]

    if (server.status === ServerStatus.RUNNING) {
      buttons.push(
        Wifi            (() => this.navigate(['wifi'])),
        ServerSpecs     (() => this.navigate(['specs'])),
        Metrics         (() => this.navigate(['metrics'])),
        DeveloperOptions(() => this.navigate(['developer-options']))
      )
    }

    buttons.push(
        Restart         (() => this.presentAlertRestart()),
        Shutdown        (() => this.presentAlertShutdown()),
        Forget          (() => this.presentAlertForget()),
    )
    
    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async presentAlertEditName () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create(
      EditFriendlyNameAlert(server, (data: { inputValue: string }) => {
        const inputValue = data.inputValue
        // return if no change
        if (server.label === inputValue) { return }
        // throw error if no server name
        if (!inputValue) {
          alert.message = 'Server must have a name'
          return false
        }
        this.serverModel.updateCache(this.serverId, { label: inputValue })
        this.serverModel.saveAll()
    }))
  
    await alert.present()
  }

  async presentAlertUpdate () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create(
      UpdateAlert(server, () => this.update())    
    )
    await alert.present()
  }

  async presentAlertRestart () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create(
      RestartAlert(server, () => this.restart())
   )
    await alert.present()
  }

  async presentAlertShutdown () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create(
      ShutdownAlert(server, () => this.shutdown())
    )
    await alert.present()
  }

  async presentAlertForget () {
    const server = this.server$.value
    const alert = await this.alertCtrl.create(
      ForgetAlert(server, () => this.forget())      
    )
    await alert.present()
  }

  async update () {
    const server = this.server$.value
    const loader = await this.loadingCtrl.create(LoadingSpinner())
    await loader.present()

    try {
      await this.serverService.updateAgent(this.serverId, server.versionLatest)
      this.serverModel.updateCache(this.serverId, { status: ServerStatus.UPDATING, statusAt: new Date().toISOString() })
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async restart () {
    const server = this.server$.value
    const loader = await this.loadingCtrl.create(
      LoadingSpinner(`Restarting ${server.label}...`)
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

  async shutdown () {
    const server = this.server$.value
    const loader = await this.loadingCtrl.create(
      LoadingSpinner(`Shutting down ${server.label}...`)
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
    await this.serverModel.removeFromCache(this.serverId)
    await this.serverModel.saveAll()
    await this.navCtrl.navigateRoot(['/auth'])
  }

  private async navigate (path: string[]): Promise<void> {
    await this.navCtrl.navigateForward(path, { relativeTo: this.route })
  }
}



type FiniteObservable<T> = Observable<T>
export const squash = map(() => {})
export function forkPause(ms: number): FiniteObservable<void> {
  return interval(ms).pipe(take(1), squash)
}
export function forkDoAll(...os: Observable<any>[]): FiniteObservable<any[]> {
  return forkJoin(os.map(a => a.pipe(take(1))))
}