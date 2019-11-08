import { InstalledApp } from '../models/installed-app'

export type TwoHundredOK = { never?: never } // hack for the unit type

export module Ap {
  export type PostSubmitWifiReq = { ssid: string, password: string }
  export type PostSubmitWifiRes = TwoHundredOK

  export type PostEnableWifiReq = { ssid: string }
  export type PostEnableWifiRes = TwoHundredOK
}

export module Lan {
  export type GetTorReq = { }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubkey: string, serial: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetStatusShallowReq = { }
  export type GetStatusShallowRes = any
  export type GetAppsInstalledReq = { }
  export type GetAppsInstalledRes = InstalledApp[]
  export type GetAppsAvailableReq = { }
  export type GetAppsAvailableRes = AvailableApp[]
  export type PostInstallAppReq = { name: string }
  export type PostInstallAppRes = InstalledApp
  export type PostUninstallAppReq = { name: string }
  export type PostUninstallAppRes = TwoHundredOK
}

export type AvailableApp = { name: string }
