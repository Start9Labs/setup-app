import { Component } from '@angular/core'
import { LoadingController, ActionSheetController, ToastController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { ActionSheetButton } from '@ionic/core'
import { pauseFor } from 'src/app/util/misc.util'

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
    private readonly loadingCtrl: LoadingController,
    private readonly actionCtrl: ActionSheetController,
    private readonly toastCtrl: ToastController,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string

    await Promise.all([
      this.getWifi,
      pauseFor(600),
    ])

    this.loading = false
  }

  async doRefresh (event: any) {
    await this.getWifi()
    event.target.complete()
  }

  async getWifi (): Promise<void> {
    try {
      const { ssids, current } = await this.serverService.getWifi(this.serverId)
      this.savedNetworks = ssids
      this.current = current
      this.error = ''
    } catch (e) {
      this.error = e.message
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
      )
    }

    const action = await this.actionCtrl.create({
      buttons,
    })

    await action.present()
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
      await this.confirmWifi(ssid)
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
      await this.confirmWifi(this.ssid)
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

  private async confirmWifi (ssid: string): Promise<void> {
    const maxAttempts = 5
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const { current, ssids } = await this.serverService.getWifi(this.serverId, 4)
        if (current === ssid) {
          this.savedNetworks = ssids
          this.current = current
          break
        } else {
          attempts++
          if (attempts === maxAttempts) {
            this.savedNetworks = ssids
            this.current = current
          }
        }
      } catch (e) {
        attempts++
        console.error(e.message)
      }
    }

    if (this.current === ssid) { return }

    const toast = await this.toastCtrl.create({
      header: 'Failed to connect:',
      message: `Check credentials and try again`,
      position: 'bottom',
      duration: 4000,
      buttons: [
        {
          side: 'start',
          icon: 'close',
          handler: () => {
            true
          },
        },
      ],
      cssClass: 'notification-toast',
    })
    await toast.present()
  }
}
