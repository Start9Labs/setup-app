import * as base32 from 'base32.js'
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

export function generateMnemonic (): string[] {
  return bip39.generateMnemonic().split(' ')
}

export function checkMnemonic (mnemonic: string[]): boolean {
  return bip39.validateMnemonic(mnemonic.join(' '))
}

export function deriveKeys (mnemonic: string[], torAddress: string): { privkey: string, pubkey: string } {
  // derive bip32 path and keys from mnemonic/torAddress
  const basePath = `m/9'`
  const decoder = new base32.Decoder({ type: 'crockford', lc: true })
  const decoded: number[] = decoder.write(torAddress).finalize()
  const first4 = new Uint8Array(decoded.slice(0, 4)).buffer
  const index = new DataView(first4).getUint32(0, false) >> 1
  const path = `${basePath}/${index}`
  const seed = bip39.mnemonicToSeedSync(mnemonic.join(' '))
  const parentNode = bip32.fromSeed(seed)
  const childNode = parentNode.derivePath(path)
  const privkey = childNode.publicKey.toString('hex')
  const pubkey = childNode.publicKey.toString('hex')
  return { privkey, pubkey }
}
