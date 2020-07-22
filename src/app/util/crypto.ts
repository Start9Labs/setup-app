import * as base32 from 'base32.js'
import * as h from 'js-sha3'
import * as elliptic from 'elliptic'
const ED25519 = elliptic.eddsa('ed25519')


export async function encrypt (secretKey: string, messageBuffer: Uint8Array): Promise<{ cipher: Uint8Array, counter: Uint8Array, salt: Uint8Array }> {
  const { key, salt } = await pbkdf2Stretch(secretKey, { name: 'AES-CTR', length: 256 })
  const counter = window.crypto.getRandomValues(new Uint8Array(16))
  const algorithm = { name: 'AES-CTR', counter, length: 64 }

  return window.crypto.subtle.encrypt(algorithm, key, messageBuffer)
    .then(encrypted => new Uint8Array(encrypted))
    .then(cipher => ({ cipher, counter, salt }))
}

export async function hmac256 (secretKey: string, messagePlain: string): Promise<{ message: Uint8Array, hmac: Uint8Array, salt: Uint8Array }> {
  const message = encodeUtf8(messagePlain)
  const { key, salt } = await pbkdf2Stretch(secretKey, { name: 'HMAC', hash: { name: 'SHA-256'}, length: 256}) // 256 is length in bites of output key

  return window.crypto.subtle.sign('HMAC', key, message)
    .then(signature => new Uint8Array(signature))
    .then(hmac => ({ hmac, message, salt }))
}

export function genPrivKey (): Uint8Array {
  return encodeUtf8(encode32(window.crypto.getRandomValues(new Uint8Array(32))))
}

export async function pbkdf2Stretch (secretKey: string, algorithm: AesKeyAlgorithm | HmacKeyGenParams): Promise<{ salt: Uint8Array, key: CryptoKey, rawKey: Uint8Array }> {
  const usages: KeyUsage[] = algorithm.name === 'AES-CTR' ? [ 'encrypt' ] : [ 'sign' ]
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encodeUtf8(secretKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  )

  const salt =  window.crypto.getRandomValues(new Uint8Array(16))
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    algorithm,
    true,
    usages,
  )

  const rawKey = await window.crypto.subtle.exportKey('raw', key).then(r => new Uint8Array(r))
  return { salt, key, rawKey }
}

export const encode16 = (buffer: Uint8Array) => buffer.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')

function encode32 (buffer: Uint8Array): string {
  const b32encoder = new base32.Encoder({ type: 'rfc4648' })
  return b32encoder.write(buffer).finalize()
}

function encodeUtf8 (str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

export async function getPubKey (privKey: Uint8Array): Promise<Uint8Array> {
  return Uint8Array.from(ED25519.keyFromSecret(privKey).getPublic())
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
