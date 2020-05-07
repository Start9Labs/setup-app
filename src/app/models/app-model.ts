import { Observable } from 'rxjs'
import { MapSubject, Update } from '../util/map-subject.util'
import { diff, partitionArray } from '../util/misc.util'
import { PropertySubject, PropertyObservableWithId } from '../util/property-subject.util'

export class AppModel extends MapSubject<AppInstalled> {
  constructor (private readonly serverId: string) { super({ }) }

  watchAppAdds (): Observable<PropertyObservableWithId<AppInstalled>[]> {
    return this.watchAdd()
  }

  watchAppDeletes (): Observable<string[]> {
    return this.watchDelete()
  }

  watchAppProperties (appId: string) : PropertySubject<AppInstalled> {
    const toReturn = this.watch(appId)
    if (!toReturn) throw new Error(`Expected app ${appId} but not found.`)
    return toReturn
  }

  peekApp (appId: string): AppInstalled {
    const toReturn = this.peek(appId)
    if (!toReturn) throw new Error(`Expected app ${appId} but not found.`)
    return toReturn
  }

  createApp (apps: AppInstalled[] | AppInstalled): void {
    if (Array.isArray(apps)) {
      this.add(apps)
    } else {
      this.add([apps])
    }
  }

  removeApp (appId: string): void {
    this.delete([appId])
  }

  updateApp (updates: Update<AppInstalled>[] | Update<AppInstalled>): void {
    if (Array.isArray(updates)) {
      this.update$.next(updates)
    } else {
      this.update$.next([updates])
    }
  }

  upsertApps (apps: AppInstalled[]): void {
    const [updates, creates] = partitionArray(apps, a => !!this.subject[a.id])
    this.updateApp(updates)
    this.createApp(creates)
  }

  syncAppCache (upToDateApps : AppInstalled[]) {
    this.deleteNonexistentApps(upToDateApps)
    this.upsertApps(upToDateApps)
  }

  markAppsUnreachable (): void {
    this.updateAppsUniformly({ status: AppStatus.UNREACHABLE })
  }

  updateAppsUniformly (uniformUpdate: Partial<AppInstalled>) {
    this.updateApp(Object.keys(this.subject).map(appId => ({
      ...uniformUpdate, id: appId,
    })))
  }

  private deleteNonexistentApps (apps: AppInstalled[]): void {
    const currentAppIds = apps.map(a => a.id)
    const previousAppIds = Object.keys(this.subject)
    const appsToDelete = diff(previousAppIds, currentAppIds)
    this.delete(appsToDelete)
  }
}

type FullyQualifiedUrl = string
type RelativeUrl = string

export interface BaseApp {
    id: string
    title: string
    status: AppStatus | null
    versionInstalled: string | null
    iconURL: string
  }

  export interface AppAvailablePreview extends BaseApp {
    versionLatest: string
    descriptionShort: string
    iconURL: FullyQualifiedUrl
  }

  export interface AppAvailableFull extends AppAvailablePreview {
    versionViewing: string
    descriptionLong: string
    releaseNotes: string
    versions: string[]
  }

  export interface AppInstalled extends BaseApp {
    torAddress?: string
    iconURL: RelativeUrl
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
