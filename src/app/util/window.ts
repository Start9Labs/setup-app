import * as base32 from 'hi-base32'
import * as ed from 'noble-ed25519'

export async function encrypt (secretKey: string, message: string): Promise<string> {
  const encoder = new TextEncoder()

  const messageUtf8 = encoder.encode(message)
  const keyUtf8 = encoder.encode(secretKey)

  const key = await crypto.subtle.importKey('raw', keyUtf8, 'AES-CTR', false, ['encrypt'])
  const counter = window.crypto.getRandomValues(new Uint8Array(16))
  const algorithm = { name: 'AES-CTR', counter, length: 256 }

  return window.crypto.subtle.encrypt(algorithm, key, messageUtf8)
    .then(encrypted => new Uint8Array(encrypted))
    .then(uint8Arr => base32.encode(uint8Arr))
}

export async function hmac (secretKey: string, message: string): Promise<string> {
  const encoder = new TextEncoder()

  const messageUtf8 = encoder.encode(message)
  const keyUtf8 = encoder.encode(secretKey)

  const key = await window.crypto.subtle.importKey( 'raw', keyUtf8, { name: 'HMAC', hash: { name: 'SHA-256'} }, false, ['sign'] )

  return window.crypto.subtle.sign('HMAC', key, messageUtf8)
    .then(signature => new Uint8Array(signature))
    .then(uint8Arr => base32.encode(uint8Arr))
}

export function genKey (): Uint8Array {
  return ed.utils.randomPrivateKey()
}