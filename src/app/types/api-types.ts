import { AppHealthStatus, AppVersion, AppConfigSpec, AppEvent } from '../models/s9-app'
import { ServerSpecs } from '../models/s9-server'

export type TwoHundredOK = { never?: never } // hack for the unit type

interface ApiAppBase {
  id: string
  title: string
  versionLatest: string
  versionInstalled?: string
  iconURL: string
}

export interface ApiAppAvailablePreview extends ApiAppBase {
  descriptionShort: string
}

export interface ApiAppAvailableFull extends ApiAppAvailablePreview {
  descriptionLong: string
  versions: AppVersion[]
}

export interface ApiAppInstalled extends ApiAppBase {
  status: AppHealthStatus
  torAddress?: string
  progress?: number
}

export type ApiAppConfig = AppConfigSpec

export interface ApiServer {
  status: AppHealthStatus
  versionInstalled: string
  versionLatest: string
  specs: ServerSpecs
  events: AppEvent[]
}

export module Lan {
  export type GetVersionReq = { }
  export type GetVersionRes = { version: string }
  export type GetTorReq = { }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubKey: string, productKey: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetServerReq = { }
  export type GetServerRes = ApiServer
  export type GetAppAvailableReq = { }
  export type GetAppAvailableRes = ApiAppAvailableFull
  export type GetAppsAvailableReq = { }
  export type GetAppsAvailableRes = ApiAppAvailablePreview[]
  export type GetAppInstalledReq = { }
  export type GetAppInstalledRes = ApiAppInstalled
  export type GetAppConfigReq = { }
  export type GetAppConfigRes = { spec: ApiAppConfig, config: object | null }
  export type GetAppLogsReq = { after?: string, before?: string, page?: string, perPage?: string }
  export type GetAppLogsRes = string[]
  export type GetAppsInstalledReq = { }
  export type GetAppsInstalledRes = ApiAppInstalled[]
  export type PostInstallAppReq = { version: string }
  export type PostInstallAppRes = ApiAppInstalled
  export type PostUpdateAgentReq = { version: string }
  export type PostUpdateAgentRes = TwoHundredOK
  export type PostUninstallAppReq = { }
  export type PostUninstallAppRes = TwoHundredOK
  export type PostStartAppReq = { }
  export type PostStartAppRes = TwoHundredOK
  export type PostStopAppReq = { }
  export type PostStopAppRes = TwoHundredOK
  export type PostUpdateAppConfigReq = { }
  export type PostUpdateAppConfigRes = TwoHundredOK
}
