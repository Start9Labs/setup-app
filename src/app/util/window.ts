import * as base32 from 'base32.js'

export async function encrypt (secretKey: string, messageBuffer: Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const b32encoder = new base32.Encoder({ type: 'rfc4648' })

  const keyBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(secretKey))

  const key = await crypto.subtle.importKey('raw', keyBuffer, 'AES-CTR', false, ['encrypt'])
  const counter = window.crypto.getRandomValues(new Uint8Array(16))
  const algorithm = { name: 'AES-CTR', counter, length: 256 }

  return window.crypto.subtle.encrypt(algorithm, key, messageBuffer)
    .then(encrypted => new Uint8Array(encrypted))
    .then(uint8Arr => b32encoder.write(uint8Arr).finalize())
}

export async function hmac (secretKey: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const b32encoder = new base32.Encoder({ type: 'rfc4648' })

  const keyBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(secretKey))

  const messageBuffer = encoder.encode(message)
  const key = await window.crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: { name: 'SHA-256'} }, false, ['sign'] )

  return window.crypto.subtle.sign('HMAC', key, messageBuffer)
    .then(signature => new Uint8Array(signature))
    .then(uint8Arr => b32encoder.write(uint8Arr).finalize())
}

export function genPrivKey (): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(32))
}