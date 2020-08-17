export abstract class HmacService {
  abstract validateHmacExpiration (secretKey: string, hmacHex: string, expirationIso: string, saltHex: string) : Promise<'hmac-invalid' | 'expiration-invalid' | 'success' >
}