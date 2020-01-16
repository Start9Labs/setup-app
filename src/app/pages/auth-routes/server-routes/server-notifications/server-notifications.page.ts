import { Component } from '@angular/core'
import { ServerModel, S9Notification } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { ServerService } from 'src/app/services/server.service'
import { LoadingController, IonInfiniteScroll, IonRefresher } from '@ionic/angular'

@Component({
  selector: 'server-notifications',
  templateUrl: 'server-notifications.page.html',
  styleUrls: ['server-notifications.page.scss'],
})
export class ServerNotificationsPage {
  error = ''
  loading = true
  server: S9Server
  notifications: S9Notification[] = []
  page = 1
  needInfinite = false
  readonly perPage = 8

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    const serverId = this.route.snapshot.paramMap.get('serverId') as string
    const server = this.serverModel.getServer(serverId)
    if (!server) throw new Error (`No server found with ID: ${serverId}`)
    this.server = server

    this.notifications = await this.getNotifications()
    this.loading = false
  }

  async doRefresh (e: any) {
    this.page = 1
    this.notifications = await this.getNotifications()
    e.target.complete()
  }

  async doInfinite (e: any) {
    const notifications = await this.getNotifications()
    this.notifications = this.notifications.concat(notifications)
    e.target.complete()
  }

  async getNotifications (): Promise<S9Notification[]> {
    let notifications: S9Notification[] = []
    try {
      notifications = await this.serverService.getNotifications(this.server, this.page, this.perPage)
      this.needInfinite = notifications.length >= this.perPage
      this.page++
    } catch (e) {
      this.error = e.message
    } finally {
      return notifications
    }
  }

  getColor (notification: S9Notification): string {
    const char = notification.code.charAt(0)
    switch (char) {
      case '0':
        return 'primary'
      case '1':
        return 'success'
      case '2':
        return 'warning'
      case '3':
        return 'danger'
      default:
        return ''
    }
  }

  async remove (notificationId: string, index: number) {
    const loader = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.deleteNotification(this.server, notificationId)
      this.notifications.splice(index, 1)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

