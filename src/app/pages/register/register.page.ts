import { Component } from '@angular/core'
import { LoadingController, NavController } from '@ionic/angular'
import { HttpService, Method, RegisterResponse, RegisterRequest } from '../../services/http/http.service'
import { KEY_GEN, encode16, encodeObject, AES_CTR } from 'src/app/util/crypto'
import { ActivatedRoute } from '@angular/router'
import { ProcessResService } from 'src/app/services/process-res.service'
import { traceDesc } from 'src/app/util/logging'
import { pauseFor } from 'src/app/util/misc'

@Component({
  selector: 'register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
})
export class RegisterPage {
  ip: string
  productKey: string
  password = ''
  passwordRetype = ''
  error = ''
  passwordError = ''

  constructor (
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly httpService: HttpService,
    private readonly processRes: ProcessResService,
  ) { }

  ngOnInit () {
    this.ip = this.route.snapshot.queryParamMap.get('ip')
    this.productKey = this.route.snapshot.queryParamMap.get('productKey')
  }

  checkPass (): boolean {
    if ((this.password || this.passwordRetype) && this.password.length < 12) {
      this.passwordError = 'Must be at least 12 characters'
      return false
    } else if (this.password && this.passwordRetype && this.password !== this.passwordRetype) {
      this.passwordError = 'Passwords do not match'
      return false
    } else {
      this.passwordError = ''
      return true
    }
  }

  async register (): Promise<void> {
    if (!this.checkPass()) { return }
    this.error = ''

    const loader = await this.loadingCtrl.create({
      message: '(1/3) Generating Ed25519 private key for Tor Hidden Service',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const [torPrivKey] = await Promise.all([
        KEY_GEN.tor().then(({ expandedSecretKey }) => expandedSecretKey),
        pauseFor(2000),
      ])

      loader.message = '(2/3) Generating RSA private key for SSL Certificate'
      await pauseFor(100)

      const [rsaPrivKey] = await Promise.all([
        KEY_GEN.rsa(),
        pauseFor(2000),
      ])

      loader.message = '(3/3) Transferring encrypted data to Embassy'

      const [pass, tor, rsa] = await Promise.all([
        this.encryptPassword(this.password),
        this.encryptTorSecretKey(torPrivKey),
        this.encryptRSAKey(rsaPrivKey),
      ])

      const passwordData = {
        password: pass.cipher,
        passwordCounter: pass.counter,
        passwordSalt: pass.salt,
      }
      const torData = {
        torkey: tor.cipher,
        torkeyCounter: tor.counter,
        torkeySalt: tor.salt,
      }
      const rsaData = {
        rsaKey: rsa.cipher,
        rsaCounter: rsa.counter,
        rsaSalt: rsa.salt,
      }

      const requestData: RegisterRequest = {
        ...rsaData,
        ...torData,
        ...passwordData,
      }

      const [{ data }] = await Promise.all([
        this.httpService.request<RegisterResponse>({
          method: Method.POST,
          url: `http://${this.ip}:5959/v0/register`,
          data: requestData,
        }),
        pauseFor(2000),
      ]).then(traceDesc('Register response'))

      loader.dismiss()
      if (await this.processRes.processRes(this.productKey, data)) {
        this.navCtrl.navigateRoot(['/devices', this.productKey], { queryParams: { fresh: true } })
      }
    } catch (e) {
      console.error(e)
      this.error = e.message
      loader.dismiss()
    }
  }

  private async encryptTorSecretKey (expandedSecretKey: Uint8Array): Promise<{ cipher: string, counter: string, salt: string }> {
    const TOR_KEY_INDICATOR = new TextEncoder().encode('== ed25519v1-secret: type0 ==')
    const res = await AES_CTR.encryptPbkdf2(this.productKey, new Uint8Array([...TOR_KEY_INDICATOR, 0, 0, 0, ...expandedSecretKey]))
    return encodeObject(encode16, res) as { cipher: string, counter: string, salt: string }
  }

  private async encryptRSAKey (rsaKey: string): Promise<{ cipher: string, counter: string, salt: string }> {
    const encodedRsaKey = new TextEncoder().encode(rsaKey) as Uint8Array
    const res = await AES_CTR.encryptPbkdf2(this.productKey, encodedRsaKey)
    return encodeObject(encode16, res) as { cipher: string, counter: string, salt: string }
  }

  private async encryptPassword (password: string): Promise<{ cipher: string, counter: string, salt: string }> {
    const PASSWORD_INDICATOR = new TextEncoder().encode('== password ==') as Uint8Array
    const encodedPassword = new TextEncoder().encode(password) as Uint8Array
    const res = await AES_CTR.encryptPbkdf2(this.productKey, new Uint8Array([...PASSWORD_INDICATOR, ...encodedPassword]))
    return encodeObject(encode16, res) as { cipher: string, counter: string, salt: string }
  }
}

