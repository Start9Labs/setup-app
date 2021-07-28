import { ZeroconfService } from '@ionic-native/zeroconf/ngx'
import { Http, HttpOptions } from '@capacitor-community/http'
import { config } from 'src/app/config'
import * as CryptoJS from 'crypto-js'
const version = require('../../../package.json').version

export class RpcService {

  async rpcRequest<T> (options: HttpOptions): Promise<T> {
    if (config.http.useMocks) {
      return { claimed: false, torAddress: 'sabhavsjknajksbasjhbxjasakasbxhjasbx' } as any
    }

    options.headers = {
      'Content-Type': 'application/json',
      'app-version': version,
    }

    try {
      const res = (await Http.request(options)).data as RPCResponse<T>

      if (isRpcError(res)) {
        throw new RpcError(res.error)
      }

      if (isRpcSuccess(res)) return res.result
    } catch (e) {
      throw new HttpError(e)
    }
  }
}

function RpcError (e: RPCError['error']): void {
  const { code, message } = e
  this.status = code
  this.message = message
  if (typeof e.data === 'string') {
    throw new Error(`unexpected response for RPC Error data: ${e.data}`)
  }
  const data = e.data || { message: 'unknown RPC error', revision: null }
  this.data = { ...data, code }
}

function HttpError (e: any): void {
  const { status, statusText, error } = e
  this.status = status
  this.message = statusText
  this.data = error || { } // error = { code: string, message: string }
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
  if (productKey.length !== 8 && productKey.length !== 12) {
    throw new Error('Product key must be 8 or 12 characters in length.')
  }
  // sha256 hash is big endian
  return CryptoJS.SHA256(productKey).toString(CryptoJS.enc.Hex).substr(0, 8)
}

export interface RegisterResponse {
  claimed: boolean // true if already claimed
  torAddress: string // encrypted with product key
}

export interface RegisterRequest {
  torPrivKey: string // encrypted with product key
}

interface RPCBase {
  jsonrpc: '2.0'
  id: string
}

interface RPCSuccess<T> extends RPCBase {
  result: T
}

interface RPCError extends RPCBase {
  error: {
    code: number
    message: string
    data?: {
      message: string
    } | string
  }
}

type RPCResponse<T> = RPCSuccess<T> | RPCError

function isRpcError<Error, Result> (arg: { error: Error } | { result: Result}): arg is { error: Error } {
  return !!(arg as any).error
}

function isRpcSuccess<Error, Result> (arg: { error: Error } | { result: Result}): arg is { result: Result } {
  return !!(arg as any).result
}
