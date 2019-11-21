import { AppHealthStatus } from '../models/s9-app'
import { ServerSpec } from '../models/s9-server'

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
  releaseNotes: string
  compatible: boolean
  version: string
}

export interface ApiAppAvailableFull extends ApiAppAvailablePreview {
  descriptionLong: string
  versions: ApiAppAvailablePreview[]
}

export interface ApiAppInstalled extends ApiAppBase {
  torAddress: string
  status: AppHealthStatus
}


export module Lan {
  export type GetVersionReq = { }
  export type GetVersionRes = { version: string }
  export type GetTorReq = { }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubKey: string, productKey: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetServerReq = { }
  export type GetServerRes = {
    status: AppHealthStatus
    version: string
    specs: ServerSpec[]
  }
  export type GetAppsInstalledReq = { }
  export type GetAppsInstalledRes = ApiAppInstalled[]
  export type GetAppAvailableReq = { }
  export type GetAppAvailableRes = ApiAppAvailableFull
  export type GetAppsAvailableReq = { }
  export type GetAppsAvailableRes = ApiAppAvailablePreview[]
  export type PostInstallAppReq = { name: string }
  export type PostInstallAppRes = ApiAppInstalled
  export type PostUninstallAppReq = { name: string }
  export type PostUninstallAppRes = TwoHundredOK
  export type PostStartAppReq = { }
  export type PostStartAppRes = ApiAppInstalled
  export type PostStopAppReq = { }
  export type PostStopAppRes = ApiAppInstalled
}
