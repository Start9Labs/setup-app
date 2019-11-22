import { SemVersion } from './s9-server'

export interface BaseApp {
  id: string
  title: string
  versionLatest: SemVersion
  versionInstalled?: SemVersion
  iconURL: string
}

export interface AvailableAppPreview extends BaseApp {
  descriptionShort: string
  releaseNotes: string
  compatible: boolean
  version: SemVersion
}

export interface AvailableAppFull extends AvailableAppPreview {
  descriptionLong: string
  versions: AvailableAppPreview[]
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  status: AppHealthStatus
  statusAt: Date
}

export enum AppHealthStatus {
  UNKNOWN = 'UNKNOWN',
  UNREACHABLE = 'UNREACHABLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  RESTARTING = 'RESTARTING',
  REMOVING = 'REMOVING',
  DEAD = 'DEAD',
}
