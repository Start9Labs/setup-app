import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class AppModel {
  appMap: { [serverId: string]:
    { [appId: string]: AppInstalled }
  } = { }

  constructor () { }

  clearCache () {
    this.appMap = { }
  }

  count (serverId: string) {
    return this.getApps(serverId).length
  }

  getApps (serverId: string): Readonly<AppInstalled>[] {
    return Object.values(this.appMap[serverId] || { }) as Readonly<AppInstalled>[]
  }

  getApp (serverId: string, appId: string): Readonly<AppInstalled> | undefined {
    return (this.appMap[serverId] && this.appMap[serverId][appId])
  }

  cacheApp (serverId: string, app: AppInstalled, updates: Partial<AppInstalled> = { }): Readonly<AppInstalled> {
    this.appMap[serverId][app.id] = Object.assign(this.getApp(serverId, app.id) || app, updates)
    return this.getApp(serverId, app.id) as Readonly<AppInstalled>
  }

  syncAppCache (serverId: string, upToDateApps : AppInstalled[]) {
    if(!this.appMap[serverId]) return

    this.appMap[serverId] = upToDateApps.reduce((acc, newApp) => {
      acc[newApp.id] = Object.assign(this.getApp(serverId, newApp.id) || { }, newApp)
      return acc
    }, { } as { [appId: string]: AppInstalled })
  }

  updateAppsUniformly (serverId: string, uniformUpdate: Partial<AppInstalled>) {
    this.getApps(serverId).forEach(
      app => this.cacheApp(serverId, app, uniformUpdate),
    )
  }

  removeApp (serverId: string, appId: string) {
    delete this.appMap[serverId][appId]
  }
}

export interface BaseApp {
  id: string
  title: string
  status: AppHealthStatus | null
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
  pattern?: {
    regex: string
    description: string
  }
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

export enum AppHealthStatus {
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
