import { Component, NgZone } from '@angular/core'
import { S9ServerModel } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/s9-server'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'

@Component({
  selector: 'page-ssh-keys',
  templateUrl: 'ssh-keys.page.html',
  styleUrls: ['ssh-keys.page.scss'],
})
export class SSHKeysPage {
  error = ''
  server: S9Server

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: S9ServerModel,
    private readonly loadingCtrl: LoadingController,
    private readonly alertCtrl: AlertController,
    private readonly serverService: ServerService,
    private readonly zone: NgZone,
  ) { }

  ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.zone.run(() => {
      this.server = server
    })
  }

  async presentAlertAdd () {
    const alert = await this.alertCtrl.create({
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
    })
    await loader.present()

    try {
      await this.serverService.addSSHKey(this.server, key)
      this.server.sshKeys.push(key)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async remove (key: string, index: number) {
    const loader = await this.loadingCtrl.create({
      message: 'Removing SSH key...',
    })
    await loader.present()

    try {
      await this.serverService.removeSSHKey(this.server, key)
      this.server.sshKeys.splice(index, 1)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

