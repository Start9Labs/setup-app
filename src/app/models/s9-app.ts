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
  torAddress: string
  status: AppHealthStatus
  statusAt: Date
}

export interface AppVersion {
  version: string
  releaseNotes: string
}

export type AppConfigSpec = { [key: string]: AppValueSpec }

export type AppValueSpec = AppValueSpecString |
                           AppValueSpecBoolean |
                           AppValueSpecEnum |
                           AppValueSpecList |
                           AppValueSpecObject

export interface AppValueSpecBase {
  type: string
  description: string
}

export interface AppValueSpecString extends AppValueSpecBase {
  type: 'string'
  nullable: boolean
  default?: DefaultSpec
  pattern?: {
    regex: RegExp
    description: string
  }
}

export interface AppValueSpecBoolean extends AppValueSpecBase {
  type: 'boolean'
  default: boolean
}

export interface AppValueSpecEnum extends AppValueSpecBase {
  type: 'enum'
  nullable: boolean
  values: string[]
  default?: string
}

export interface AppValueSpecList extends AppValueSpecBase {
  type: 'list'
  spec: AppValueSpec
  length: string // '0..1' (inclusive) OR '0..' (right unbounded)
}

export interface AppValueSpecObject extends AppValueSpecBase {
  type: 'object'
  nullable: boolean
  spec: AppConfigSpec
}

export type DefaultSpec = string | { charset: string, length: string }

export enum AppHealthStatus {
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  NEEDS_CONFIG = 'NEEDS_CONFIG',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  REMOVING = 'REMOVING',
  DEAD = 'DEAD',
}
