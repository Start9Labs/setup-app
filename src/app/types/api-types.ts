import { InstalledApp, AvailableApp, AppHealthStatus, BaseApp } from '../models/s9-app'
import { ServerSpec } from '../models/s9-server'

export type TwoHundredOK = { never?: never } // hack for the unit type

// export module Ap {
//   export type PostSubmitWifiReq = { ssid: string, password: string }
//   export type PostSubmitWifiRes = TwoHundredOK

//   export type PostEnableWifiReq = { ssid: string }
//   export type PostEnableWifiRes = TwoHundredOK
// }

export module Lan {
  export type GetVersionReq = { }
  export type GetVersionRes = { version: string }
  export type GetTorReq = { }
  export type GetTorRes = { torAddress: string }
  export type PostRegisterReq = { pubkey: string, serial: string }
  export type PostRegisterRes = TwoHundredOK
  export type GetServerReq = { }
  export type GetServerRes = {
    status: AppHealthStatus
    version: string
    specs: ServerSpec[]
  }
  export type GetAppsInstalledReq = { }
  export type GetAppsInstalledRes = (BaseApp & { torAddress: string, status: AppHealthStatus })[]
  export type GetAppsAvailableReq = { }
  export type GetAppsAvailableRes = AvailableApp[]
  export type PostInstallAppReq = { name: string }
  export type PostInstallAppRes = InstalledApp
  export type PostUninstallAppReq = { name: string }
  export type PostUninstallAppRes = TwoHundredOK
  export type PostStartAppReq = { }
  export type PostStartAppRes = InstalledApp
  export type PostStopAppReq = { }
  export type PostStopAppRes = InstalledApp
}
