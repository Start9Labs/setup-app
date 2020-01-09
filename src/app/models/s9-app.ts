import { Omit } from '../util/misc.util'

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
  events?: AppEvent[]
}

export interface AppVersion {
  version: string
  releaseNotes: string
}

export interface AppEvent {
  id: string
  created_at: string
  code: number
  message: string
}

export type AppConfigSpec = { [key: string]: ValueSpec }

export type ValueSpec = ValueSpecString |
  ValueSpecBoolean |
  ValueSpecEnum |
  ValueSpecList |
  ValueSpecObject

export type ListValueSpec = ListValueSpecString |
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
  length: string // '0..1' (inclusive) OR '0..' (right unbounded)
  default: string[] | DefaultString[] | object[]
}

export type DefaultString = string | { charset: string, length: string }

export enum AppHealthStatus {
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  DOWNLOADING = 'DOWNLOADING',
  INSTALLING = 'INSTALLING',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  REMOVING = 'REMOVING',
  DEAD = 'DEAD',
}
