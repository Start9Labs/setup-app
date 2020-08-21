export abstract class HmacService {
  abstract validateHmac (secretKey: string, hmacHex: string, message: string, saltHex: string) : Promise<'hmac-invalid' | 'success' >
}