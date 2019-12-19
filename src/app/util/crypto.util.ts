import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

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
  let res = ''
  for ( let i = 0; i < length; i++ ) {
     res += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return res
}
