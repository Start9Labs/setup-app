import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { diff, both } from '../util/misc.util'

@Injectable({
  providedIn: 'root',
})
export class AppModel {
  lightCache: { [serverId: string]: BehaviorSubject <{ [appId: string]: BehaviorSubject<AppInstalled> }> } = { }

  constructor () { }

  watch (serverId: string, appId: string): BehaviorSubject<AppInstalled> {
    if (!this.lightCache[serverId])              throw new Error(`Expected cached apps for server ${serverId}.`)
    if (!this.lightCache[serverId].value[appId]) throw new Error(`Expected cached app ${appId} for server ${serverId}.`)
    return this.lightCache[serverId].value[appId]
  }

  watchServerCache (serverId:  string): Observable<{ [appId: string]: BehaviorSubject<AppInstalled> }> {
    if (!this.lightCache[serverId]) throw new Error(`Expected cached apps for server ${serverId}.`)
    return this.lightCache[serverId]
  }

  peek (serverId: string, appId: string): AppInstalled {
    if (!this.lightCache[serverId])              throw new Error(`Expected cached apps for server ${serverId}.`)
    if (!this.lightCache[serverId].value[appId]) throw new Error(`Expected cached app ${appId} for server ${serverId}.`)
    return this.lightCache[serverId].value[appId].value
  }

  peekS (serverId: string, appId: string): AppInstalled | undefined {
    try {
      return this.peek(serverId, appId)
    } catch (e) {
      return undefined
    }
  }

  peekServerCache (serverId: string): { [appId: string]: BehaviorSubject<AppInstalled> } {
    if (!this.lightCache[serverId]) throw new Error(`Expected cached apps for server ${serverId}.`)
    return this.lightCache[serverId].value
  }

   // no op if already exists
   // will notify subscribers to the server's app array
  create (serverId: string, app: AppInstalled): void {
    if (!this.lightCache[serverId]) throw new Error(`Expected cached apps for server ${serverId}.`)
    if (!this.peekS(serverId, app.id)) {
      const previousCache = this.peekServerCache(serverId)
      previousCache[app.id] = new BehaviorSubject(app)
      this.lightCache[serverId].next(previousCache)
    }
  }

  createServerCache (serverId: string): void {
    if (this.lightCache[serverId]) return
    this.lightCache[serverId] = new BehaviorSubject({ })
  }

  update (serverId: string, appId: string, update: Partial<AppInstalled>): void {
    if (!this.lightCache[serverId]) { throw new Error(`Expected cached apps for server ${serverId}.`) }
    if (this.peekS(serverId, appId)) {
      const updatedApp = { ...this.peek(serverId, appId), ...update }
      this.lightCache[serverId].value[appId].next(updatedApp)
      this.lightCache[serverId].next(this.peekServerCache(serverId))
    }
  }

   // no op if missing
  remove (serverId: string, appId: string): void {
    if (!this.lightCache[serverId]) { throw new Error(`Expected cached apps for server ${serverId}.`) }
    if (this.peekS(serverId, appId)) {
      const previousCache = this.peekServerCache(serverId)
      this.lightCache[serverId].value[appId].complete()
      delete previousCache[appId]
      this.lightCache[serverId].next(previousCache)
    }
  }

  count (serverId: string): number {
    return this.peekAll(serverId).length
  }

  peekAll (serverId: string): Readonly<AppInstalled>[] {
    return Object.values(this.peekServerCache(serverId)).map(s => s.value)
  }

  clearCache () {
    Object.keys(this.lightCache).forEach( serverId => {
      Object.keys(this.lightCache[serverId].value).forEach( appId => {
        this.lightCache[serverId].value[appId].complete()
      })
      this.lightCache[serverId].complete()
    })

    this.lightCache = { }
  }

  syncAppCache (serverId: string, allUpToDateApps : AppInstalled[]) {
    if (!this.lightCache[serverId]) return

    const previousAppIds = Object.keys(this.lightCache[serverId].value)
    const currentAppIds = allUpToDateApps.map(a => a.id)

    const appsLost = diff(previousAppIds, currentAppIds)
    const appsGained = diff(currentAppIds, previousAppIds)
    const appsToUpdate = both(previousAppIds, currentAppIds)


    appsLost.forEach( appId => {
      this.lightCache[serverId].value[appId].complete()
    })

    const tmp = { }

    appsToUpdate.forEach( appId => {
      const updatedApp = { ...this.peek(serverId, appId), ...allUpToDateApps.find(a => a.id == appId) as AppInstalled}
      this.lightCache[serverId].value[appId].next(updatedApp)
      tmp[appId] = this.lightCache[serverId].value[appId]
    })

    appsGained.forEach ( appId => {
      this.lightCache[serverId].value[appId] = new BehaviorSubject(allUpToDateApps.find(a => a.id == appId) as AppInstalled)
      tmp[appId] = this.lightCache[serverId].value[appId]
    })

    this.lightCache[serverId].next(tmp)
  }

  updateAppsUniformly (serverId: string, uniformUpdate: Partial<AppInstalled>) {
    const tmp = {  }
    Object.entries(this.peekServerCache(serverId)).forEach( ([appId, appSubject]) => {
      const updatedApp = { ...appSubject.value, ...uniformUpdate }
      this.lightCache[serverId].value[appId].next(updatedApp)
      tmp[appId] = this.lightCache[serverId].value[appId]
    })

    this.lightCache[serverId].next(tmp)
  }
}

export interface BaseApp {
  id: string
  title: string
  status: AppStatus | null
  statusAt: string
  versionLatest: string
  versionInstalled: string | null
  iconURL: string
}

export interface AppAvailablePreview extends BaseApp {
  descriptionShort: string
}

export interface AppAvailableFull extends AppAvailablePreview {
  versionViewing: string
  descriptionLong: string
  releaseNotes: string
  versions: string[]
}

export interface AppInstalled extends BaseApp {
  torAddress?: string
}

export type AppConfigSpec = { [key: string]: ValueSpec }

export type ValueSpec = ValueSpecString |
                        ValueSpecNumber |
                        ValueSpecBoolean |
                        ValueSpecEnum |
                        ValueSpecList |
                        ValueSpecObject

export type ListValueSpec = ListValueSpecString |
                            ListValueSpecNumber |
                            ListValueSpecEnum |
                            ListValueSpecObject

export interface ValueSpecBase {
  type: string
  added?: boolean
  invalid?: boolean
}

export interface WithStandalone {
  name: string
  description: string
  changeWarning?: string
}

export interface ListValueSpecString extends ValueSpecBase {
  type: 'string'
  pattern?: string
  patternDescription?: string
}

export interface ValueSpecString extends ListValueSpecString, WithStandalone {
  default?: DefaultString
  nullable: boolean
}

export interface ListValueSpecNumber extends ValueSpecBase {
  type: 'number'
  range: string
  integral: boolean
  units?: string
}

export interface ValueSpecNumber extends ListValueSpecNumber, WithStandalone {
  nullable: boolean
  default?: number
}

export interface ListValueSpecEnum extends ValueSpecBase {
  type: 'enum'
  values: string[]
}

export interface ValueSpecEnum extends ListValueSpecEnum, WithStandalone {
  default: string
}

export interface ListValueSpecObject extends ValueSpecBase {
  type: 'object'
  spec: AppConfigSpec
}

export interface ValueSpecObject extends ListValueSpecObject, WithStandalone {
  nullable: boolean
  nullByDefault: boolean
}

export interface ValueSpecBoolean extends ValueSpecBase, WithStandalone {
  type: 'boolean'
  default: boolean
}

export interface ValueSpecList extends ValueSpecBase {
  name: string
  type: 'list'
  spec: ListValueSpec
  description: string
  changeWarning?: string
  range: string // '[0,1]' (inclusive) OR '[0,*)' (right unbounded), normal math rules
  default: string[] | number[] | DefaultString[] | object[]
}

export type DefaultString = string | { charset: string, len: number }

export interface Rules {
  rule: string
  description: string
}

export enum AppStatus {
  // shared
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  INSTALLING = 'INSTALLING',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RECOVERABLE = 'RECOVERABLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  REMOVING = 'REMOVING',
  DEAD = 'DEAD',
}
