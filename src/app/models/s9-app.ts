export interface BaseApp {
  id: string
  title: string
  versionLatest: string
  versionInstalled?: string
  iconURL: string
}

export interface AvailableAppPreview extends BaseApp {
  descriptionShort: string
}

export interface AvailableAppFull extends AvailableAppPreview {
  descriptionLong: string
  releaseNotes: string
  versions: AppVersion[]
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  status: AppHealthStatus
  statusAt: Date
}

export interface AppVersion {
  version: string
  releaseNotes: string
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
