import { AppHealthStatus } from '../models/s9-app'
import { ServerSpec } from '../models/s9-server'

export type TwoHundredOK = { never?: never } // hack for the unit type

export interface ApiBaseApp {
  id: string
  title: string
  versionLatest: string
  versionInstalled?: string
  iconURL: string
}

export interface ApiAvailableApp extends ApiBaseApp {
  descriptionShort: string
  descriptionLong: string
  releaseNotes: string
  compatible: boolean
  version: string
}

export interface ApiInstalledApp extends ApiBaseApp {
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
  export type GetAppsInstalledRes = ApiInstalledApp[]
  export type GetAppsAvailableReq = { }
  export type GetAppsAvailableRes = ApiAvailableApp[]
  export type PostInstallAppReq = { name: string }
  export type PostInstallAppRes = ApiInstalledApp
  export type PostUninstallAppReq = { name: string }
  export type PostUninstallAppRes = TwoHundredOK
  export type PostStartAppReq = { }
  export type PostStartAppRes = ApiInstalledApp
  export type PostStopAppReq = { }
  export type PostStopAppRes = ApiInstalledApp
}
