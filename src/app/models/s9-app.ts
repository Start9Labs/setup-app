export interface BaseApp {
  id: string
  title: string
  versionInstalled: number
}

export interface AvailableApp extends BaseApp {
  version: number
  descriptionShort: string
  descriptionLong: string
  releaseNotes: string
  installed: boolean
  compatible: boolean
}

export interface InstalledApp extends BaseApp {
  torAddress: string
  lastStatus: StatusCheck
}

export function initAppStatus (): StatusCheck {
  return { status: AppStatus.running, timestamp: new Date() }
}

export function fromStorableApp (app: StorableApp): InstalledApp {
  const { id, versionInstalled, title, torAddress } = app
  return {
    id,
    versionInstalled,
    title,
    lastStatus: initAppStatus(),
    torAddress,
  }
}

export function toStorableApp (app: InstalledApp): StorableApp {
  const { id, versionInstalled, title, torAddress } = app
  return {
    id,
    versionInstalled,
    title,
    torAddress,
  }
}

export interface StorableApp {
  id: string
  versionInstalled: number
  title: string
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