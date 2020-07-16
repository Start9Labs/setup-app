import * as base32 from 'base32.js'
import * as ed from 'noble-ed25519'
import * as h from 'js-sha3'

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

export async function hmac256 (secretKey: string, message: string): Promise<string> {
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

export async function getPubKey (privKey: Uint8Array): Promise<Uint8Array> {
  return ed.getPublicKey(privKey)
}

// onion_address = base32(PUBKEY | CHECKSUM | VERSION) + ".onion"
// CHECKSUM = H(".onion checksum" | PUBKEY | VERSION)[:2]

// where:
//   - PUBKEY is the 32 bytes ed25519 master pubkey of the hidden service.
//   - VERSION is an one byte version field (default value '\x03')
//   - ".onion checksum" is a constant string
//   - CHECKSUM is truncated to two bytes before inserting it in onion_address
export function onionFromPubkey (pk: Uint8Array): string {
  const hasher = h.sha3_256.create()
  hasher.update('.onion checksum')
  hasher.update(pk)
  hasher.update([3])

  const checksum = new Uint8Array(hasher.arrayBuffer().slice(0, 2))
  const version = [3]
  const id = new Uint8Array([...pk, ...checksum, ...version])
  return (new base32.Encoder({ type: 'rfc4648' }).write(id).finalize()) + '.onion'
}

const PKEY_LENGTH = 32
export function onionToPubkey (onion: string): ArrayBuffer {
  const s = onion.split('.')[0].toUpperCase()

  const decoded = new Uint8Array(new base32.Decoder({ type: 'rfc4648', lc: true }).write(s).finalize())

  if (decoded.byteLength > 35) {
      throw new Error('Invalid base32 length.')
  }
  if (decoded[34] !== 3) {
      throw new Error('Invalid version')
  }
  const pubkey = decoded.slice(0, PKEY_LENGTH)

  const hasher = h.sha3_256.create()
  hasher.update('.onion checksum')
  hasher.update(pubkey)
  hasher.update([3])

  const checksum = new Uint8Array(hasher.arrayBuffer().slice(0, 2))
  const oldChecksum = decoded.slice(PKEY_LENGTH, PKEY_LENGTH + 2 )

  if (!checksum.every( (x, i) => x === oldChecksum[i] )) {
      throw new Error ('Invalid checksum')
  }
  return pubkey
}
