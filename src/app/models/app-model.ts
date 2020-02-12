import { BehaviorSubject, Observable } from 'rxjs'
import { MapSubject } from '../util/map-subject.util'
import { diff } from '../util/misc.util'

export type ServerDeltaType = 'Create' | 'Delete' | 'Update'

export class AppModel extends MapSubject<AppInstalled> {
  constructor (private readonly serverId: string) { super({ }) }

  watchAppAdds (): Observable<AppInstalled[]> {
    return this.add$.asObservable()
  }

  watchAppDeletes (): Observable<string[]> {
    return this.delete$.asObservable()
  }

  watchApp (appId: string) : BehaviorSubject<AppInstalled> {
    const toReturn = this.watchUpdate(appId)
    if (!toReturn) throw new Error(`Expected app ${appId} but not found.`)
    return toReturn
  }

  peekApp (appId: string): AppInstalled {
    const toReturn = this.peek(appId)
    if (!toReturn) throw new Error(`Expected app ${appId} but not found.`)
    return toReturn
  }

  // no op if already exists
  createInCache (app: AppInstalled): void {
    this.add$.next([app])
  }

  // no op if missing
  removeFromCache (appId: string): void {
    this.delete$.next([appId])
  }

  // no op if missing
  updateCache (id: string, update: Partial<AppInstalled>): void {
    this.update$.next([{ ...update, id }])
  }

  count (): number { return this.peekAll().length }

  private deleteDiff (apps: AppInstalled[]): void {
    const currentAppIds = apps.map(a => a.id)
    const previousAppIds = Object.keys(this.subject)
    const appsToDelete = diff(previousAppIds, currentAppIds)
    this.delete$.next(appsToDelete)
  }

  upsertApps (apps: AppInstalled[]): void {
    apps.forEach(app => {
      if (this.subject[app.id]) {
        this.updateCache(app.id, app)
      } else {
        this.createInCache(app)
      }
    })
  }

  syncAppCache (upToDateApps : AppInstalled[]) {
    this.deleteDiff(upToDateApps)
    this.upsertApps(upToDateApps)
  }

  updateAppsUniformly (uniformUpdate: Partial<AppInstalled>) {
    Object.keys(this.subject).forEach(appId => {
      this.updateCache(appId, uniformUpdate)
    })
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
    subtype: 'string' | 'number' | 'enum' | 'object'
    spec: ListValueSpecString | ListValueSpecNumber | ListValueSpecEnum | ListValueSpecObject
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
