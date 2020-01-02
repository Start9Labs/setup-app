import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import { clone } from '../models/server-model'

export type Hex = string & { __type: 'hex' }
export function isHex (s: string): s is Hex {
  return new RegExp('^([0-9a-fA-F]{2})*$').test(s)
}
export function asHex (s: string): Hex {
  if (isHex(s)) {
    return s
  }
  throw new Error(`ParseError(${JSON.stringify(s)} -> Hex)`)
}
export function hexFromArrayBuffer (a: ArrayBuffer): Hex {
  return Buffer.from(a).toString('hex') as Hex
}
export function arrayBufferFromHex (a: Hex): ArrayBuffer {
  return Buffer.from(a, 'hex').buffer
}

export function generateMnemonic (): string[] {
  return bip39.generateMnemonic().split(' ')
}

export function checkMnemonic (mnemonic: string[]): boolean {
  return bip39.validateMnemonic(mnemonic.join(' '))
}

export function deriveKeys (mnemonic: string[], serverId: string): { privkey: string, pubkey: string } {
  // derive bip32 path and keys from mnemonic/torAddress
  const basePath = `m/9'`
  const decoded = Buffer.from(serverId, 'hex')
  const first4 = decoded.slice(0, 4).buffer
  const index = Math.floor(new DataView(first4).getUint32(0, false) / 2)
  const path = `${basePath}/${index}`
  const seed = bip39.mnemonicToSeedSync(mnemonic.join(' '))
  const parentNode = bip32.fromSeed(seed)
  const childNode = parentNode.derivePath(path)
  const privkey = childNode.privateKey!.toString('hex')
  const pubkey = childNode.publicKey.toString('hex')
  return { privkey, pubkey }
}

export function getRandomNumberInRange (min: number, max: number): number {
  // ( Math.random() * (max - min + 1) ) << 0
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function getRandomCharInSet (charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length))
}

export async function encrypt (data: string, pin: string): Promise<Hex> {
  const key = await getKey(pin)
  let encoded = new TextEncoder().encode(data)
  let iv = window.crypto.getRandomValues(new Uint8Array(16))

  let enc = await window.crypto.subtle.encrypt({
    name: 'AES-CTR',
    counter: iv,
    length: 64,
  }, key, encoded)

  return (hexFromArrayBuffer(iv) + hexFromArrayBuffer(enc)) as Hex
}

export async function decrypt (encrypted: Hex, pin: string): Promise<string> {
  const key = await getKey(pin)
  let encBuf = arrayBufferFromHex(encrypted)

  const arrayBuff = await window.crypto.subtle.decrypt({
    name: 'AES-CTR',
    counter: encBuf.slice(0, 16),
    length: 64,
  }, key, encBuf.slice(16))

  return new TextDecoder().decode(arrayBuff)
}

async function getKey (pin: string): Promise<CryptoKey> {
  const arrayBuff = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return window.crypto.subtle.importKey('raw', arrayBuff, { name: 'AES-CTR', length: 64 }, false, ['encrypt', 'decrypt'])
}
