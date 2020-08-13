import { Component } from '@angular/core'
import { LoadingController, NavController, AlertController } from '@ionic/angular'
import { HttpService, Method, RegisterResponse, RegisterRequest } from '../../services/http/http.service'
import { AppState } from 'src/app/app-state'
import { genTorKey, genRSAKey, encode16, encodeObject, AES_CTR, HMAC, decode16 } from 'src/app/util/crypto'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
})
export class RegisterPage {
  id: string
  ip: string
  productKey: string
  password = ''
  error = ''

  constructor (
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
    private readonly appState: AppState,
    private readonly httpService: HttpService,
  ) { }

  ngOnInit () {
    this.id = this.route.snapshot.queryParamMap.get('id')
    this.ip = this.route.snapshot.queryParamMap.get('ip')
    this.productKey = this.route.snapshot.queryParamMap.get('productKey')
  }

  async register (): Promise<void> {
    this.error = ''

    const loader = await this.loadingCtrl.create({
      message: '(1/3) Generating Ed25519 private key for Tor Hidden Service',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const [torPrivKey] = await Promise.all([
        genTorKey(),
        pauseFor(4000),
      ])

      loader.message = '(2/3) Generating RSA private key for SSL Certificate. This could take a while...'
      await pauseFor(100)

      const [rsaPrivKey] = await Promise.all([
        genRSAKey(),
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
        pauseFor(4000),
      ])

      const validRes = await HMAC.verify256(this.productKey, decode16(data.hmac), data.message, decode16(data.salt))
      if (!validRes) { return this.presentAlertInvalidRes() }

      await this.appState.addDevice(this.id, data.torAddress, data.cert)

      this.navCtrl.navigateRoot(['/devices', this.id])
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      loader.dismiss()
    }
  }

  private async presentAlertInvalidRes () {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: 'Unable to verify response from Embassy. It is possible you are experiencing a "Man in the Middle" attack. Please contact support.',
      buttons: ['OK'],
    })

    return alert.present()
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

export function pauseFor (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
