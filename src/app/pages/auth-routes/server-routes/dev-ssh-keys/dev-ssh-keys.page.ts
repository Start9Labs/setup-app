import { Component } from '@angular/core'
import { SSHFingerprint } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController } from '@ionic/angular'
import { ApiService } from 'src/app/services/api.service'
import { pauseFor } from 'src/app/util/misc.util'

@Component({
  selector: 'dev-ssh-keys',
  templateUrl: 'dev-ssh-keys.page.html',
  styleUrls: ['dev-ssh-keys.page.scss'],
})
export class DevSSHKeysPage {
  error = ''
  loading = true
  fingerprints: SSHFingerprint[] = []
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
    private readonly apiService: ApiService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    await Promise.all([
      this.getSSHKeys(),
      pauseFor(600),
    ])

    this.loading = false
  }

  async doRefresh (event: any) {
    await Promise.all([
      this.getSSHKeys(),
      pauseFor(600),
    ])
    event.target.complete()
  }

  async getSSHKeys () {
    try {
      this.fingerprints = await this.apiService.getSSHKeys(this.serverId)
      this.error = ''
    } catch (e) {
      console.error(e)
      this.error = e.message
    }
  }

  async presentAlertAdd () {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'New Key',
      inputs: [
        {
          name: 'key',
          type: 'text',
          placeholder: 'Enter public key',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Save',
          handler: (data: { key: string }) => {
            // return if no value
            if (!data.key) { return }
            // add value and mark edited
            this.add(data.key)
          },
        },
      ],
      cssClass: 'alert-config-value',
    })
    await alert.present()
  }

  async add (key: string) {
    const loader = await this.loadingCtrl.create({
      message: 'Adding SSH key...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      const fingerprint = await this.apiService.addSSHKey(this.serverId, key)
      this.fingerprints.unshift(fingerprint)
      this.error = ''
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async delete (fingerprint: SSHFingerprint, index: number) {
    const loader = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.apiService.deleteSSHKey(this.serverId, fingerprint.hash)
      this.fingerprints.splice(index, 1)
      this.error = ''
    } catch (e) {
      console.error(e)
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

