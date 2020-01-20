import { ActivatedRoute } from '@angular/router'
import { S9Server, ServerModel } from 'src/app/models/server-model'

export function serverFromRouteParam (route: ActivatedRoute, serverModel: ServerModel): S9Server {
  const serverId = route.snapshot.paramMap.get('serverId') as string
  const server = serverModel.getServer(serverId)
  if (!server) throw new Error (`No server found with ID: ${serverId}`)
  return server
}