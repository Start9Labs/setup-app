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
  running = 'running',
  stopped = 'stopped',
  notfound = 'notfound',
  unreachable = 'unreachable',
  unknown = 'unknown',
  uninstalled = 'uninstalled', // server should not respond with this
}

export function initAppStatus (): AppStatusAttempt {
  return { status: AppHealthStatus.running, timestamp: new Date() }
}