import { Component } from '@angular/core'
import { ServerModel, SSHFingerprint } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'dev-ssh-keys',
  templateUrl: 'dev-ssh-keys.page.html',
  styleUrls: ['dev-ssh-keys.page.scss'],
})
export class DevSSHKeysPage {
  error = ''
  loading = true
  server: S9Server
  fingerprints: SSHFingerprint[] = []
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    await this.getSSHKeys()
  }

  async doRefresh (event: any) {
    await this.getSSHKeys()
    event.target.complete()
  }

  async getSSHKeys () {
    try {
      this.fingerprints = await this.serverService.getSSHKeys(this.serverId)
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
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
      const fingerprint = await this.serverService.addSSHKey(this.serverId, key)
      this.fingerprints.unshift(fingerprint)
      this.error = ''
    } catch (e) {
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
      await this.serverService.deleteSSHKey(this.serverId, fingerprint.hash)
      this.fingerprints.splice(index, 1)
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

