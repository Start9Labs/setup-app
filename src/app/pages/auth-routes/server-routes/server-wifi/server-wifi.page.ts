import { Component } from '@angular/core'
import { LoadingController, ActionSheetController, AlertController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { ActionSheetButton } from '@ionic/core'

@Component({
  selector: 'server-wifi',
  templateUrl: 'server-wifi.page.html',
  styleUrls: ['server-wifi.page.scss'],
})
export class ServerWifiPage {
  savedNetworks: string[] = []
  current: string | null
  ssid = ''
  password = ''
  serverId: string
  error = ''
  loading = true

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
    private readonly alertCtrl: AlertController,
    private readonly loadingCtrl: LoadingController,
    private readonly actionCtrl: ActionSheetController,
  ) { }

  ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.getWifi()
  }

  async getWifi () {
    try {
      const { ssids, current } = await this.serverService.getWifi(this.serverId)
      this.savedNetworks = ssids
      this.current = current
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async presentAction (ssid: string, i: number) {
    const buttons: ActionSheetButton[] = [
      {
        text: 'Forget',
        cssClass: 'alert-danger',
        handler: () => {
          this.delete(ssid, i)
        },
      },
    ]

    if (ssid !== this.current) {
      buttons.unshift(
        {
          text: 'Connect',
          handler: () => {
            this.connect(ssid)
          },
        },
        {
          text: 'Update Password',
          handler: () => {
            this.presentAlertUpdatePassword(ssid)
          },
        },
      )
    }

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
  }

  async presentAlertUpdatePassword (ssid: string) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Update Password',
      inputs: [
        {
          name: 'inputValue',
          placeholder: 'Enter new password',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data: { inputValue: string }) => {
            this.update(ssid, data.inputValue)
          },
        },
      ],
    })
    await alert.present()
  }

  async connect (ssid: string): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting. This could take while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.connectWifi(this.serverId, ssid)
      this.current = ssid
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async update (ssid: string, password: string): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting. This could take while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.updateWifi(this.serverId, ssid, password)
      this.current = ssid
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async add (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting. This could take while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.addWifi(this.serverId, this.ssid, this.password)
      this.savedNetworks.unshift(this.ssid)
      this.current = this.ssid
      this.ssid = ''
      this.password = ''
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }

  async delete (ssid: string, index: number): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.deleteWifi(this.serverId, ssid)
      this.savedNetworks.splice(index, 1)
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

