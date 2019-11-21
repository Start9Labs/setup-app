import { SemVersion } from './s9-server'

export interface BaseApp {
  id: string
  title: string
  versionLatest: SemVersion
  versionInstalled?: SemVersion
  iconURL: string
}

export interface AvailableApp extends BaseApp {
  descriptionShort: string
  descriptionLong: string
  releaseNotes: string
  compatible: boolean
  version: SemVersion
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
