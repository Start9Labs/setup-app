import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

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

interface CharSet {
  ranges: {
    start: string
    end: string
    len: number
  }[]
  len: number
}
function stringToCharSet (charset: string): CharSet {
  let set: CharSet = { ranges: [], len: 0 }
  let start: string | null = null
  let end: string | null = null
  let in_range = false
  for (let char of charset) {
    switch (char) {
      case ',':
        if (start !== null && end !== null) {
          if (start!.charCodeAt(0) > end!.charCodeAt(0)) {
            throw new Error('start > end of charset')
          }
          const len = end.charCodeAt(0) - start.charCodeAt(0) + 1
          set.ranges.push({
            start,
            end,
            len,
          })
          set.len += len
          start = null
          end = null
          in_range = false
        } else if (start !== null && !in_range) {
          set.len += 1
          set.ranges.push({ start, end: start, len: 1 })
          start = null
        } else if (start !== null && in_range) {
          end = ','
        } else if (start === null && end === null && !in_range) {
          start = ','
        } else {
          throw new Error('unexpected ","')
        }
        break
      case '-':
        if (start === null) {
          start = '-'
        } else if (!in_range) {
          in_range = true
        } else if (in_range && end === null) {
          end = '-'
        } else {
          throw new Error('unexpected "-"')
        }
        break
      default:
        if (start === null) {
          start = char
        } else if (in_range && end === null) {
          end = char
        } else {
          throw new Error(`unexpected "${char}"`)
        }
    }
  }
  if (start !== null && end !== null) {
    if (start!.charCodeAt(0) > end!.charCodeAt(0)) {
      throw new Error('start > end of charset')
    }
    const len = end.charCodeAt(0) - start.charCodeAt(0) + 1
    set.ranges.push({
      start,
      end,
      len,
    })
    set.len += len
  } else if (start !== null) {
    set.len += 1
    set.ranges.push({
      start,
      end: start,
      len: 1,
    })
  }
  return set
}

// a,g,h,A-Z,,,,-
export function getRandomCharInSet (charset: string): string {
  const set = stringToCharSet(charset)
  let charIdx = Math.floor(Math.random() * set.len)
  for (let range of set.ranges) {
    if (range.len > charIdx) {
      return String.fromCharCode(range.start.charCodeAt(0) + charIdx)
    }
    charIdx -= range.len
  }
  throw new Error('unreachable')
}

export async function hash (data: string): Promise<Hex> {
  const arrayBuf = await window.crypto.subtle.digest('SHA-256', Buffer.from(data, 'utf-8').buffer)
  return hexFromArrayBuffer(arrayBuf)
}

export async function encrypt (data: string, pin: string): Promise<Hex> {
  data = (await hash(data)).slice(0, 8) + data
  const key = await getKey(String(pin))
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

  let data = new TextDecoder().decode(arrayBuff)
  if ((await hash(data.slice(8))).slice(0, 8) !== data.slice(0, 8)) {
    throw new Error(`Invalid pin`)
  }

  return data.slice(8)
}

async function getKey (pin: string): Promise<CryptoKey> {
  const arrayBuff = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return window.crypto.subtle.importKey('raw', arrayBuff, { name: 'AES-CTR', length: 64 }, false, ['encrypt', 'decrypt'])
}
