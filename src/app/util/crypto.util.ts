export async function encryptTorKey (torKey: Uint8Array, productKey: string): Promise<{ cipher: string, counter: string, salt: string }> {
  const TOR_KEY_INDICATOR = new TextEncoder().encode('== ed25519v1-secret: type0 ==')
  const res = await AES_CTR.encryptPbkdf2(productKey, new Uint8Array([...TOR_KEY_INDICATOR, 0, 0, 0, ...torKey]))
  return encodeObject(encode16, res) as { cipher: string, counter: string, salt: string }
}

export async function decryptTorAddress (encryptedTorAddr: string, productKey: string): Promise<string> {
  return 'blablabla.onion'
  // const decoded = encryptedTorAddr
  // // const decoded = base32.decode(encryptedTorAddr) as string
  // const counter = new TextEncoder().encode(decoded.slice(0, 16))
  // const salt = new TextEncoder().encode(decoded.slice(16, 32))
  // const ciphertext = new TextEncoder().encode(decoded.slice(32))
  // const encodedAddr = await AES_CTR.decryptPbkdf2(productKey, {
  //   counter,
  //   salt,
  //   ciphertext,
  // })
  // return new TextDecoder().decode(encodedAddr)
}

type AES_CTR = {
  encryptPbkdf2: (privKey: string, messageBuffer: Uint8Array) => Promise<{ ciphertext: Uint8Array, counter: Uint8Array, salt: Uint8Array }>
  decryptPbkdf2: (privKey: string, a: { ciphertext: Uint8Array, counter: Uint8Array, salt: Uint8Array }) => Promise<Uint8Array>
}

export const AES_CTR: AES_CTR = {
  encryptPbkdf2: async (privKey: string, messageBuffer: Uint8Array) =>  {
    const { key, salt } = await pbkdf2(privKey, { name: 'AES-CTR', length: 256 })
    const counter = window.crypto.getRandomValues(new Uint8Array(16))
    const algorithm = { name: 'AES-CTR', counter, length: 64 }

    return window.crypto.subtle.encrypt(algorithm, key, messageBuffer)
      .then(encrypted => new Uint8Array(encrypted))
      .then(ciphertext => ({ ciphertext, counter, salt }))
  },
  decryptPbkdf2: async (privKey: string, a: { ciphertext: Uint8Array, counter: Uint8Array, salt: Uint8Array }) =>  {
    const { ciphertext, counter, salt } = a
    const { key } = await pbkdf2(privKey, { name: 'AES-CTR', length: 256 }, salt)
    const algorithm = { name: 'AES-CTR', counter, length: 64 }

    return window.crypto.subtle.decrypt(algorithm, key, ciphertext)
      .then(decrypted => new Uint8Array(decrypted))
  },
}

export async function generateTorKey (): Promise<Uint8Array> {
  const random = window.crypto.getRandomValues(new Uint8Array(32))
  let torKey = new Uint8Array(await crypto.subtle.digest('SHA-512', random))
  torKey[0]  &= 248
  torKey[31] &= 127
  torKey[31] |= 64
  return torKey
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

function encodeUtf8 (str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

export function encodeObject (encoder: (u: Uint8Array) => string, object: { [key: string]: Uint8Array }): { [key: string]: string } {
  const toReturn = { }
  Object.keys(object).forEach( k => {
    toReturn[k] = encoder(object[k])
  } )
  return toReturn
}