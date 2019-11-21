export interface BaseApp {
  id: string
  title: string
  version: string
  versionInstalled?: string
  iconURL: string
}

export interface AvailableApp extends BaseApp {
  descriptionShort: string
  descriptionLong: string
  releaseNotes: string
  compatible: boolean
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  status: AppHealthStatus
  statusAt: Date
}

export enum AppHealthStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  NOT_FOUND = 'NOT_FOUND',
  UNREACHABLE = 'UNREACHABLE',
  UNKNOWN = 'UNKNOWN',
}
