import { Component } from '@angular/core'
import { LoadingController } from '@ionic/angular'
import { ServerService } from 'src/app/services/server.service'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'server-wifi',
  templateUrl: 'server-wifi.page.html',
  styleUrls: ['server-wifi.page.scss'],
})
export class ServerWifiPage {
  savedNetworks: string[] = []
  ssid = ''
  password = ''
  serverId: string
  error = ''
  loading = true

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.getWifi()
  }

  async getWifi () {
    try {
      this.savedNetworks = await this.serverService.getWifi(this.serverId)
      this.error = ''
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  }

  async save (): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Connecting. This could take while...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.addWifi(this.serverId, this.ssid, this.password)
      this.savedNetworks.unshift(this.ssid)
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

