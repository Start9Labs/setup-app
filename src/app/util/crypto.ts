import * as base32 from 'base32.js'
import * as h from 'js-sha3'
import * as elliptic from 'elliptic'
import * as RSA from 'node-rsa'
const ED25519 = elliptic.eddsa('ed25519')


type AES_CTR = {
  encryptPbkdf2: (secretKey: string, messageBuffer: Uint8Array) => Promise<{ cipher: Uint8Array, counter: Uint8Array, salt: Uint8Array }>
  decryptPbkdf2: (secretKey, a: { cipher: Uint8Array, counter: Uint8Array, salt: Uint8Array }) => Promise<Uint8Array>
}

export const AES_CTR: AES_CTR = {
  encryptPbkdf2: async (secretKey: string, messageBuffer: Uint8Array) =>  {
    const { key, salt } = await STRETCH.pbkdf2(secretKey, { name: 'AES-CTR', length: 256 })
    const counter = window.crypto.getRandomValues(new Uint8Array(16))
    const algorithm = { name: 'AES-CTR', counter, length: 64 }

    return window.crypto.subtle.encrypt(algorithm, key, messageBuffer)
      .then(encrypted => new Uint8Array(encrypted))
      .then(cipher => ({ cipher, counter, salt }))
  },
  decryptPbkdf2: async (secretKey: string, a: { cipher: Uint8Array, counter: Uint8Array, salt: Uint8Array }) =>  {
    const { cipher, counter, salt } = a
    const { key } = await STRETCH.pbkdf2(secretKey, { name: 'AES-CTR', length: 256 }, salt)
    const algorithm = { name: 'AES-CTR', counter, length: 64 }

    return window.crypto.subtle.decrypt(algorithm, key, cipher)
      .then(decrypted => new Uint8Array(decrypted))
  },
}

/** HMAC */
type HMAC = {
  sha256: (secretKey: string, messagePlain: string, saltOverride?: Uint8Array) => Promise<{ message: Uint8Array, hmac: Uint8Array, salt: Uint8Array }>
  verify256: (secretKey: string, hmac: Uint8Array, messagePlain: String, salt: Uint8Array) => Promise<boolean>
}

const sha256 = async (secretKey: string, messagePlain: string, saltOverride?: Uint8Array) => {
  const message = encodeUtf8(messagePlain)
  const { key, salt } = await STRETCH.pbkdf2(secretKey, { name: 'HMAC', hash: { name: 'SHA-256'}, length: 256}, saltOverride) //256 is the length in bits of the output key

  return window.crypto.subtle.sign('HMAC', key, message)
    .then(signature => new Uint8Array(signature))
    .then(hmac => ({ hmac, message, salt }))
}

export const HMAC: HMAC = {
  sha256,
  verify256: async (secretKey: string, hmac: Uint8Array, messagePlain: string, salt: Uint8Array) => {
    const { hmac: computedHmac } = await sha256(secretKey, messagePlain, salt)
    return hmac.every(( _, i ) => computedHmac[i] === hmac[i])
  },
}

export async function genRSAKey (): Promise<string> {
  return new RSA({ b: 4096 }).exportKey()
}

export async function genTorKey (): Promise<Uint8Array> {
  const entropy = window.crypto.getRandomValues(new Uint8Array(32))
  let privKey = new Uint8Array(await crypto.subtle.digest('SHA-512', entropy))
  privKey[0] &= 248
  privKey[31] &= 127
  privKey[31] |= 64
  return privKey
}

/** KEY STRETCH */
type STRETCH = {
  pbkdf2: (secretKey: string, algorithm: AesKeyAlgorithm | HmacKeyGenParams, salt?: Uint8Array) => Promise<{ salt: Uint8Array, key: CryptoKey, rawKey: Uint8Array }>
}
export const STRETCH: STRETCH = {
  pbkdf2,
}

async function pbkdf2 (secretKey: string, algorithm: AesKeyAlgorithm | HmacKeyGenParams, salt = window.crypto.getRandomValues(new Uint8Array(16))): Promise<{ salt: Uint8Array, key: CryptoKey, rawKey: Uint8Array }> {
  const usages: KeyUsage[] = algorithm.name === 'AES-CTR' ? [ 'encrypt' ] : [ 'sign' ]
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encodeUtf8(secretKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  )

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
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
export const decode16 = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

function encode32 (buffer: Uint8Array): string {
  const b32encoder = new base32.Encoder({ type: 'rfc4648' })
  return b32encoder.write(buffer).finalize()
}

function encodeUtf8 (str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

export async function getPubKey (privKey: Uint8Array): Promise<Uint8Array> {
  return Uint8Array.from(ED25519.keyFromSecret(privKey.slice(0, 32)).getPublic())
}

export const cryptoUtils = {
  encode16, decode16, getPubKey, onionFromPubkey, genTorKey,
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

export function encodeObject (encoder: (u: Uint8Array) => string, object: { [key: string]: Uint8Array }): { [key: string]: string } {
  const toReturn = { }
  Object.keys(object).forEach( k => {
    toReturn[k] = encoder(object[k])
  } )
  return toReturn
}