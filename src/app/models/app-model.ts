import { Omit } from '../util/misc.util'
import { Injectable } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { AuthStatus } from '../types/enums'

@Injectable({
  providedIn: 'root',
})
export class AppModel {
  apps: { [serverId: string]: AppInstalled[] } = { }

  constructor (
    private readonly authService: AuthService,
  ) { }

  init () {
    this.authService.authState.subscribe(authStatus => {
      if (authStatus !== AuthStatus.VERIFIED) {
        this.apps = { }
      }
    })
  }

  getApps (serverId: string): AppInstalled[] {
    return this.apps[serverId]
  }

  getApp (serverId: string, appId: string): AppInstalled | undefined {
    return this.apps[serverId].find(a => a.id === appId)
  }

  cacheApp (serverId: string, app: AppInstalled) {
    let existing = this.getApp(serverId, app.id)

    if (existing) {
      Object.assign(existing, app)
    } else {
      this.apps[serverId].push(app)
    }
  }

  removeApp (serverId: string, appId: string) {
    const index = this.apps[serverId].findIndex(a => a.id === appId)
    if (index > -1) {
      this.apps[serverId].splice(index, 1)
    }
  }
}

export interface BaseApp {
  id: string
  title: string
  versionLatest: string
  versionInstalled?: string
  iconURL: string
}

export interface AppAvailablePreview extends BaseApp {
  descriptionShort: string
}

export interface AppAvailableFull extends AppAvailablePreview {
  descriptionLong: string
  releaseNotes: string
  versions: AppVersion[]
}

export interface AppInstalled extends BaseApp {
  status: AppHealthStatus
  statusAt: Date
  torAddress?: string
  progress?: number
}

export interface AppVersion {
  version: string
  releaseNotes: string
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
  description: string
  nullable: boolean
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
}

export interface ListValueSpecNumber extends ValueSpecBase {
  type: 'number'
  range: string
}

export interface ValueSpecNumber extends ListValueSpecNumber, WithStandalone {
  default?: number
}

export interface ListValueSpecEnum extends ValueSpecBase {
  type: 'enum'
  values: string[]
}

export interface ValueSpecEnum extends ListValueSpecEnum, WithStandalone {
  default?: string
}

export interface ListValueSpecObject extends ValueSpecBase {
  type: 'object'
  spec: AppConfigSpec
}

export interface ValueSpecObject extends ListValueSpecObject, WithStandalone { }

export interface ValueSpecBoolean extends ValueSpecBase, Omit<WithStandalone, 'nullable'> {
  type: 'boolean'
  default: boolean
}

export interface ValueSpecList extends ValueSpecBase {
  type: 'list'
  spec: ListValueSpec
  description: string
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
  DOWNLOADING = 'DOWNLOADING',
  INSTALLING = 'INSTALLING',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RECOVERABLE = 'RECOVERABLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  REMOVING = 'REMOVING',
  DEAD = 'DEAD',
}
