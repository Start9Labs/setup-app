export interface InstalledApp {
  id: string
  displayName: string
  torAddress: string
  lastStatus: StatusCheck
}

export function initAppStatus (): StatusCheck {
  return { healthy: false, timestamp: new Date() }
}

export function fromStorableApp (app : StorableApp): InstalledApp {
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
  healthy: boolean
  timestamp: Date
}
