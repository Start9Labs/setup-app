import { AppStatus, AppConfigSpec, Rules } from '../models/app-model'
import { ServerSpecs, S9Notification, ServerMetrics, SSHFingerprint, ServerStatus, AppMetrics } from '../models/server-model'

export type TwoHundredOK = { never?: never } // hack for the unit type

interface ApiAppBase {
  id: string
  title: string
  status: AppStatus | null
  versionInstalled: string | null
  iconURL: string
}

export interface ApiAppAvailablePreview extends ApiAppBase {
  versionLatest: string
  descriptionShort: string
}

export interface ApiAppAvailableFull extends ApiAppAvailablePreview {
  releaseNotes: string
  descriptionLong: string
  versions: string[]
}

export type ApiAppInstalled = ApiAppInstalled011 | ApiAppInstalled012

export interface ApiAppInstalled011 extends ApiAppBase {
  versionLatest: string
  torAddress?: string
}

export interface ApiAppInstalled012 extends ApiAppBase {
  torAddress: string
}

export type ApiServer = ApiServer011 | ApiServer012

export interface ApiServer011 {
  status: ServerStatus
  versionLatest: string
  versionInstalled: string
}

export interface ApiServer012 {
  status: ServerStatus
  versionInstalled: string
  notifications: S9Notification[]
}

export interface ApiAppConfig {
  spec: AppConfigSpec
  config: object | null
  rules: Rules[]
}

export interface ApiAppVersionInfo {
  releaseNotes: string
}

export module ReqRes {
  export type GetVersionReq = { [k: string]: never }
  export type GetVersionRes = { version: string }
  export type GetTorReq = { [k: string]: never }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubKey: string, productKey: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetServerReq = { [k: string]: never }
  export type GetServerRes = ApiServer
  export type GetVersionLatestReq = { [k: string]: never }
  export type GetVersionLatestRes = { versionLatest: string, canUpdate: boolean }
  export type GetServerSpecsReq = { [k: string]: never }
  export type GetServerSpecsRes = ServerSpecs
  export type GetServerMetricsReq = { [k: string]: never }
  export type GetServerMetricsRes = ServerMetrics
  export type GetAppAvailableReq = { [k: string]: never }
  export type GetAppAvailableRes = ApiAppAvailableFull
  export type GetAppsAvailableReq = { [k: string]: never }
  export type GetAppsAvailableRes = ApiAppAvailablePreview[]
  export type GetAppAvailableVersionInfoReq = { [k: string]: never }
  export type GetAppAvailableVersionInfoRes = ApiAppVersionInfo
  export type GetAppInstalledReq = { [k: string]: never }
  export type GetAppInstalledRes = ApiAppInstalled
  export type GetAppConfigReq = { [k: string]: never }
  export type GetAppConfigRes = ApiAppConfig
  export type GetAppLogsReq = { after?: string, before?: string, page?: string, perPage?: string }
  export type GetAppLogsRes = string[]
  export type GetAppMetricsReq = { [k: string]: never }
  export type GetAppMetricsRes = AppMetrics | null
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
  export type DeleteNotificationReq = { [k: string]: never }
  export type DeleteNotificationRes = TwoHundredOK
  export type GetWifiReq = { [k: string]: never }
  export type GetWifiRes = { ssids: string[], current: string }
  export type PostAddWifiReq = { ssid: string, password: string, country: string }
  export type PostAddWifiRes = TwoHundredOK
  export type PostConnectWifiReq = { country: string }
  export type PostConnectWifiRes = TwoHundredOK
  export type DeleteWifiReq = { [k: string]: never }
  export type DeleteWifiRes = TwoHundredOK
  export type GetSSHKeysReq = { [k: string]: never }
  export type GetSSHKeysRes = SSHFingerprint[]
  export type PostAddSSHKeyReq = { sshKey: string }
  export type PostAddSSHKeyRes = SSHFingerprint
  export type DeleteSSHKeyReq = { [k: string]: never }
  export type DeleteSSHKeyRes = TwoHundredOK
  export type PostWipeAppDataReq = { [k: string]: never }
  export type PostWipeAppDataRes = TwoHundredOK
  export type PostRestartServerReq = { [k: string]: never }
  export type PostRestartServerRes = TwoHundredOK
  export type PostShutdownServerReq = { [k: string]: never }
  export type PostShutdownServerRes = TwoHundredOK
}
