export type TwoHundredOK = { never?: never } // hack for the unit type

export module Ap {
  export type GetTorReq = { }
  export type GetTorRes = { torAddress: string }

  export type PostSubmitWifiReq = { ssid: string, password: string }
  export type PostSubmitWifiRes = TwoHundredOK

  export type PostEnableWifiReq = { ssid: string }
  export type PostEnableWifiRes = TwoHundredOK
}

export module Lan {
  export type PostHandshakeReq = { } // eventually add deviceId: public-key
  export type PostHandshakeRes = TwoHundredOK
}
