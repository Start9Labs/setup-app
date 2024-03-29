import { Component } from '@angular/core'
import { AlertController, isPlatform, LoadingController, NavController } from '@ionic/angular'
import { HttpService, Method, RegisterResponse, RegisterRequest } from '../../services/http/http.service'
import { KEY_GEN, encode16, encodeObject, AES_CTR } from 'src/app/util/crypto'
import { ActivatedRoute } from '@angular/router'
import { ProcessResResult, ProcessResService } from 'src/app/services/process-res.service'
import { pauseFor } from 'src/app/util/misc'
import { Insomnia } from '@ionic-native/insomnia/ngx'

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
  unmasked1 = false
  unmasked2 = false

  constructor (
    private readonly route: ActivatedRoute,
    private readonly navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly httpService: HttpService,
    private readonly processRes: ProcessResService,
    private readonly insomnia: Insomnia,
    private readonly alertCtrl: AlertController,
  ) { }

  ngOnInit () {
    this.ip = this.route.snapshot.queryParamMap.get('ip')
    this.productKey = this.route.snapshot.queryParamMap.get('productKey')
  }

  toggleMask (field: 1 | 2) {
    if (field === 1) {
      this.unmasked1 = !this.unmasked1
    } else if (field === 2) {
      this.unmasked2 = !this.unmasked2
    }
  }

  checkPass (): boolean {
    if (this.password || this.passwordRetype) {
      if (this.password.length < 12) {
        this.passwordError = 'Password must be at least 12 characters'
        return false
      } else if (this.password.length > 64) {
        this.passwordError = 'Password must be 64 characters or less'
        return false
      }
    }

    if (this.password && this.passwordRetype && this.password !== this.passwordRetype) {
      this.passwordError = 'Passwords do not match'
      return false
    }

    this.passwordError = ''
    return true
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
        pauseFor(2500),
      ])

      loader.message = '(2/3) Generating RSA private key for SSL Certificate'
      await pauseFor(100)

      const [rsaPrivKey] = await Promise.all([
        KEY_GEN.rsa(),
        pauseFor(2500),
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

      // don't let phone fall asleep
      if (isPlatform('cordova')) {
        await this.insomnia.keepAwake()
      }

      const [{ data, status }] = await Promise.all([
        this.httpService.request<RegisterResponse>({
          method: Method.POST,
          url: `http://${this.ip}:5959/v0/register`,
          data: requestData,
        }),
        pauseFor(2500),
      ])

      loader.dismiss()

      if (status === 209) {
        return this.navCtrl.back()
      }

      const processedResult = await this.processRes.processRes(this.productKey, data)
      switch (processedResult) {
        case ProcessResResult.InvalidTorAddress: return this.presentAlertInvalidRes('tor address')
        case ProcessResResult.InvalidSslCert: return this.presentAlertInvalidRes('ssl cert')
        case ProcessResResult.AllGood: return this.navCtrl.navigateRoot(['/devices', this.productKey, 'tor'], { queryParams: { success: true } }).then(chill)
      }
    } catch (e) {
      console.error(e)
      this.error = 'Failed to generate enough randomness for private key generation. This is a rare but known issue that will be fixed in EmbassyOS 0.3.0. Please unplug your device, plug it back in, and start over from scratch. That should resolve the issue.'
      loader.dismiss()
    } finally {
      // allow phone to sleep again
      if (isPlatform('cordova')) {
        this.insomnia.allowSleepAgain()
      }
    }
  }

  private async presentAlertInvalidRes (sigDescription: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: `Unable to verify ${sigDescription} response from Embassy. It is possible you are experiencing a "Man in the Middle" attack, and you should contact support at support@start9labs.com.`,
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

const chill = () => { }