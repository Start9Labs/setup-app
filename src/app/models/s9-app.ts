import { S9Server, HandshakeAttempt, S9ServerBuilder, S9ServerTor } from './s9-server'

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

export function companionApp (ss: S9ServerTor): InstalledApp {
  const lastStatus = {
    status: ss.lastHandshake.success ? AppStatus.running : AppStatus.stopped,
    timestamp: ss.lastHandshake.timestamp,
  }
  return {
    id: ss.id,
    title: 's9 agent',
    versionInstalled: 0,
    torAddress: ss.torAddress,
    lastStatus,
  }
}

export type StatusCheck = {
  status: AppStatus
  timestamp: Date
}

export enum AppStatus {
  running = 'running',
  stopped = 'stopped',
}