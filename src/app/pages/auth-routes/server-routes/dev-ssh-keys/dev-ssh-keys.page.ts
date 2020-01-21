import { Component } from '@angular/core'
import { ServerModel, SSHFingerprint } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'

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

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
    private readonly serverService: ServerService,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    await this.getSSHKeys()
  }

  async doRefresh (event: any) {
    await this.getSSHKeys()
    event.target.complete()
  }

  async getSSHKeys () {
    try {
      this.fingerprints = await this.serverService.getSSHKeys(this.server)
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
      const fingerprint = await this.serverService.addSSHKey(this.server, key)
      this.fingerprints.unshift(fingerprint)
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
      await this.serverService.deleteSSHKey(this.server, fingerprint.hash)
      this.fingerprints.splice(index, 1)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

