export interface BaseApp {
  id: string
  title: string
  versionInstalled?: string
  iconPath: string
}

export interface AvailableApp extends BaseApp {
  version: string
  descriptionShort: string
  descriptionLong: string
  releaseNotes: string
  installed: boolean
  compatible: boolean
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  lastStatus: AppStatusAttempt
}

export type AppStatusAttempt = {
  status: AppHealthStatus, timestamp: Date
}

export enum AppHealthStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  NOT_FOUND = 'NOT_FOUND',
  UNREACHABLE = 'UNREACHABLE',
  UNKNOWN = 'UNKNOWN',
}

export function initAppStatus (): AppStatusAttempt {
  return { status: AppHealthStatus.RUNNING, timestamp: new Date() }
}