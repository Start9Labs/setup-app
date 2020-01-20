import { AppDaemon } from 'src/app/daemons/app-daemon'
import { AppModel } from 'src/app/models/app-model'
import { ServerService } from 'src/app/services/server.service'
import { S9Server, ServerModel } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'

export class AppSyncingPage {
  private static ACTIVE_DAEMON: AppDaemon

  constructor (
    protected readonly serverService: ServerService,
    protected readonly appModel: AppModel,
  ) { }

  conjureAppDaemon (server: S9Server): AppDaemon {
    if (!AppSyncingPage.ACTIVE_DAEMON || AppSyncingPage.ACTIVE_DAEMON.getServerId() !== server.id) {

      //just in case we didn't stop it already... let's stop the active daemon before we replace it
      AppSyncingPage.ACTIVE_DAEMON && AppSyncingPage.ACTIVE_DAEMON.stop()
      AppSyncingPage.ACTIVE_DAEMON = new AppDaemon(
        this.serverService,
        this.appModel,
        server,
      )
    }
    return AppSyncingPage.ACTIVE_DAEMON
  }

  ngOnInit (server: S9Server) {
    this.conjureAppDaemon(server).start()
 }

  ngOnDestroy () {
    AppSyncingPage.ACTIVE_DAEMON.stop()
  }
}

export function serverFromRouteParam (route: ActivatedRoute, serverModel: ServerModel): S9Server {
  const serverId = route.snapshot.paramMap.get('serverId') as string
  const server = serverModel.getServer(serverId)
  if (!server) throw new Error (`No server found with ID: ${serverId}`)
  return server
}