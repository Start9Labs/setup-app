export interface BaseApp {
  id: string
  displayName: string
}

export interface AvailableApp extends BaseApp {
  installed: boolean
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  lastStatus: StatusCheck
}

export function initAppStatus (): StatusCheck {
  return { status: AppStatus.stopped, timestamp: new Date() }
}

export function fromStorableApp (app: StorableApp): InstalledApp {
  const { id, displayName, torAddress } = app
  return {
    id,
    displayName,
    lastStatus: initAppStatus(),
    torAddress,
  }
}

export function toStorableApp (app: InstalledApp): StorableApp {
  const { id, displayName, torAddress } = app
  return {
    id,
    displayName,
    torAddress,
  }
}

export interface StorableApp {
  id: string
  displayName: string
  torAddress: string
}

export type StatusCheck = {
  status: AppStatus
  timestamp: Date
}

export enum AppStatus {
  running = 'running',
  stopped = 'stopped',
}