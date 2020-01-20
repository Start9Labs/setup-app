import { AppHealthStatus, AppConfigSpec, Rules } from '../models/app-model'
import { ServerSpecs, S9Notification, ServerMetrics } from '../models/server-model'

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
  versionViewing: string
  releaseNotes: string
  descriptionLong: string
  versions: string[]
}

export interface ApiAppInstalled extends ApiAppBase {
  status: AppHealthStatus
  torAddress?: string
  progress?: number
}


export interface ApiServer {
  status: AppHealthStatus
  versionInstalled: string
  versionLatest: string
  notifications: S9Notification[]
}

export interface ApiAppConfig {
  spec: AppConfigSpec,
  config: object | null
  rules: Rules[]
}

export module Lan {
  export type GetVersionReq = { [k: string]: never }
  export type GetVersionRes = { version: string }
  export type GetTorReq = { [k: string]: never }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubKey: string, productKey: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetServerReq = { [k: string]: never }
  export type GetServerRes = ApiServer
  export type GetServerSpecsReq = { [k: string]: never }
  export type GetServerSpecsRes = ServerSpecs
  export type GetServerMetricsReq = { [k: string]: never }
  export type GetServerMetricsRes = ServerMetrics
  export type GetAppAvailableReq = { version?: string }
  export type GetAppAvailableRes = ApiAppAvailableFull
  export type GetAppsAvailableReq = { [k: string]: never }
  export type GetAppsAvailableRes = ApiAppAvailablePreview[]
  export type GetAppInstalledReq = { [k: string]: never }
  export type GetAppInstalledRes = ApiAppInstalled
  export type GetAppConfigReq = { [k: string]: never }
  export type GetAppConfigRes = ApiAppConfig
  export type GetAppLogsReq = { after?: string, before?: string, page?: string, perPage?: string }
  export type GetAppLogsRes = string[]
  export type GetAppsInstalledReq = { [k: string]: never }
  export type GetAppsInstalledRes = ApiAppInstalled[]
  export type PostInstallAppReq = { version: string }
  export type PostInstallAppRes = ApiAppInstalled
  export type PostUpdateAgentReq = { version: string }
  export type PostUpdateAgentRes = TwoHundredOK
  export type PostUninstallAppReq = { [k: string]: never }
  export type PostUninstallAppRes = TwoHundredOK
  export type PostStartAppReq = { [k: string]: never }
  export type PostStartAppRes = TwoHundredOK
  export type PostStopAppReq = { [k: string]: never }
  export type PostStopAppRes = TwoHundredOK
  export type PostUpdateAppConfigReq = { config: object }
  export type PostUpdateAppConfigRes = TwoHundredOK
  export type GetNotificationsReq = { page: string, perPage: string }
  export type GetNotificationsRes = S9Notification[]
  export type DeleteNotificationReq = { id: string }
  export type DeleteNotificationRes = TwoHundredOK
  export type GetSSHKeysReq = { [k: string]: never }
  export type GetSSHKeysRes = string[]
  export type PostAddSSHKeyReq = { sshKey: string }
  export type PostAddSSHKeyRes = string
  export type DeleteSSHKeyReq = { sshKey: string }
  export type DeleteSSHKeyRes = TwoHundredOK
  export type PostWipeAppDataReq = { [k: string]: never }
  export type PostWipeAppDataRes = TwoHundredOK
  export type PostRestartServerReq = { [k: string]: never }
  export type PostRestartServerRes = TwoHundredOK
  export type PostShutdownServerReq = { [k: string]: never }
  export type PostShutdownServerRes = TwoHundredOK
}
