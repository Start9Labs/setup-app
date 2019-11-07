import * as base32 from 'base32.js'
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

export async function run () {
  const basePath = `m/9'`
  const torAddress = 'fncuwbiisyh6ak3ifncuwbiisyh6ak3ifncuwbiisyh6ak3iabababab'
  const decoder = new base32.Decoder({ type: 'crockford', lc: true })
  const decoded: number[] = decoder.write(torAddress).finalize()
  console.log('decoded', decoded)
  const first4 = new Uint8Array(decoded.slice(0, 4)).buffer
  console.log('first4', first4)
  const index = new DataView(first4).getUint32(0, false) >> 1
  console.log('index', index)
  const words = getMnemonic().join(' ')
  console.log('words', words)
  const seed = bip39.mnemonicToSeedSync(words)
  console.log('seed', seed)
  const node = bip32.fromSeed(seed)
  const pubkey = node.derivePath(`${basePath}/${index}`).publicKey.toString('hex')
  console.log(pubkey)
}

export function getMnemonic (): string[] {
  return bip39.generateMnemonic().split(' ')
}

export function checkMnemonic (mnemonic: string[]): boolean {
  return bip39.validateMnemonic(mnemonic.join(' '))
}
