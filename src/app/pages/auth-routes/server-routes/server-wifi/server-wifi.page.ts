import { Component } from '@angular/core'
import { LoadingController, ActionSheetController, ToastController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'
import { ActionSheetButton } from '@ionic/core'
import { ZeroconfDaemon } from 'src/app/daemons/zeroconf-daemon'
import { pauseFor } from 'src/app/util/misc.util'
import { ZeroconfResult } from '@ionic-native/zeroconf/ngx'

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
    private readonly zeroconfDaemon: ZeroconfDaemon,
    private readonly toastCtrl: ToastController,
  ) { }

  ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.getWifi()
  }

  async getWifi (): Promise<void> {
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
      await this.discoverService(ssid)
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
      await this.discoverService(this.ssid)
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

  private async discoverService (ssid: string): Promise<void> {
    let timeRemaining = 10 // seconds
    // start countdown
    let interval: NodeJS.Timeout | undefined = setInterval(() => { timeRemaining--; console.log(timeRemaining) }, 1000)
    // watch for zeroconf updates
    let success = false
    let zeroconfMonitor = this.zeroconfDaemon.watchUpdated().subscribe(async service => {
      // if the updated service pertains to our server
      if (service && service.name.split('-')[1] === this.serverId) {
        // stop the countdown while we inquire about wifi networks
        if (interval) { clearInterval(interval); interval = undefined }
        await this.getWifi()
        // if we are connected, end the countdown
        if (ssid === this.current) {
          success = true
          timeRemaining = 0
        // if we are not conencted, keep going
        } else {
          // resume countdown
          if (!interval && timeRemaining) { interval = setInterval(() => { timeRemaining--; console.log(timeRemaining) }, 1000) }
        }
      }
    })

    // **** MOCK ****
    // setTimeout(() => this.zeroconfDaemon.handleServiceUpdate(result), 4000)

    // pause until countdown complete
    while (timeRemaining > 0) { await pauseFor(100) }
    // clear interval and unsubscribe
    clearInterval(interval)
    zeroconfMonitor.unsubscribe()
    // present success or failure toast
    const toast = await this.toastCtrl.create({
      header: success ? 'Success!' : 'Failed to connect:',
      message: success ? `Connected to ${ssid}` : `Check credentials and ensure your phone is also connected to ${ssid}`,
      position: 'bottom',
      duration: success ? 2000 : 4000,
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

const result: ZeroconfResult = {
  action: 'resolved',
  service: {
    domain: 'local.',
    type: '_http._tcp',
    name: 'start9-1f3ce404',
    hostname: '',
    ipv4Addresses: ['192.168.20.1'],
    ipv6Addresses: ['end9823u0ej2fb'],
    port: 5959,
    txtRecord: { },
  },
}
