import { HttpOptions, HttpResponse } from '@start9labs/capacitor-http'
import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import * as CryptoJS from 'crypto-js'

export abstract class HttpService {
  abstract request<T> (opt: HttpOptions): Promise<TypedHttpResponse<T>>
}

export interface TypedHttpResponse<T> extends HttpResponse {
  data: T
}

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export function getLanIP (zcs: ZeroconfService): string {
  const { ipv4Addresses, ipv6Addresses } = zcs

  let url: string
  if (ipv4Addresses.length) {
    url = ipv4Addresses[0]
  } else {
    url = `[${ipv6Addresses[0]}]`
  }
  return url
}

export function idFromProductKey (productKey: string): string {
  // sha256 hash is big endian
  return CryptoJS.SHA256(productKey).toString(CryptoJS.enc.Hex).substr(0, 8)
}

export type HostsResponse = { __: never } | RegisterResponse
export function isAlreadyClaimed (h: HostsResponse): h is RegisterResponse {
  return !!(h as any || { }).claimedAt
}
export interface RegisterResponse {
  claimedAt: string
  torAddressSig: HmacSig
  certSig: HmacSig
  certName: string
  lanAddress: string
}

export interface HmacSig {
  hmac: string,
  message: string,
  salt: string
}

export interface RegisterRequest {
  rsaKey: string
  rsaCounter: string
  rsaSalt: string
  torkey: string
  torkeyCounter: string
  torkeySalt: string
  password: string
  passwordCounter: string
  passwordSalt: string
}
