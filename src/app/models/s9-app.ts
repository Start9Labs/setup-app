import { S9Server, AppHealthStatus, AppStatusAttempt } from './s9-server'

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

export function initAppStatus (): AppStatusAttempt {
  return { status: AppHealthStatus.running, timestamp: new Date() }
}

export function toS9AgentApp (ss: S9Server): InstalledApp {
  return {
    id: 'start9Agent',
    title: 'S9 agent',
    versionInstalled: ss.version,
    torAddress: ss.torAddress,
    lastStatus: ss.lastStatusAttempt,
    iconPath: 'assets/img/agent.png',
  }
}