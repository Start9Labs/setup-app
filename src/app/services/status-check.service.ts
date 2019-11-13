import { HttpService, HttpOptions } from './http.service'
import { S9Server, AppStatusAttempt, AppHealthStatus, unknownAppStatusAttempt } from '../models/s9-server'
import { S9BuilderWith, SetupService } from './setup.service'
import { Lan } from '../types/api-types'
import { Method } from '../types/enums'
import { Injectable } from '@angular/core'
import { InstalledApp } from '../models/s9-app'
import { Valued, toObject } from '../util/misc.util'
import { HttpParams } from '@angular/common/http'
import { Timestamp } from 'rxjs/internal/operators/timestamp'
import { runInContext } from 'vm'

@Injectable()
export class StatusCheckService {
  private static readonly timeout = 2000

  constructor (private readonly httpService: HttpService) { }

  async getS9AgentStatus (ss: S9Server | S9BuilderWith<'zeroconfService' | 'privkey'>) : Promise<{ attempt: AppStatusAttempt, version: number | undefined}> {
    const timestamp = new Date()
    try {
      let options: HttpOptions = { }
      const { status, version } = await this.httpService.authServerRequest<Lan.GetStatusShallowRes>(ss, Method.get, '/status/shallow', options, { }, StatusCheckService.timeout)
      return { attempt: { status, timestamp}, version }
    } catch (e) {
      console.error(`failed to get server status for ${ss.id}: ${e.message}`)
      return { attempt: { status: AppHealthStatus.unreachable, timestamp}, version: undefined }
    }
  }

  async getAppStatus (ss: S9Server, apps: InstalledApp[]) : Promise<Valued<{ attempt: AppStatusAttempt, version: number | undefined}>> {
    const timestamp = new Date()
    const appIdList = apps.map(a => a.id)

    try {
      const options: HttpOptions = { params: { ids: appIdList.join(',')} }
      const res = await this.httpService.authServerRequest<Lan.GetAppShallowRes>(
        ss, Method.get, '/apps/installed/status/shallow?apps=oisdjfo,boijsdof,boijsdf', options, { }, StatusCheckService.timeout,
      )
      const mappedRes = res.map( r => ({ version: r.version, id: r.id, attempt: {
          status: r.status,
          timestamp,
        },
      }))

      return toObject(mappedRes, r => r.id)
    } catch (e) {
      console.error(`failed to get app statuses for server ${ss.id}: ${e.message}`)

      return toObject(appIdList.map( id => {
        return {
          id, attempt: { status: AppHealthStatus.unreachable, timestamp }, version: undefined,
        }
      }), r => r.id)
    }
  }
}