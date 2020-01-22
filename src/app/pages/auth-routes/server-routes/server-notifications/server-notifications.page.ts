import { Component } from '@angular/core'
import { ServerModel, S9Notification } from 'src/app/models/server-model'
import { S9Server } from 'src/app/models/server-model'
import { ActivatedRoute } from '@angular/router'
import { ServerService } from 'src/app/services/server.service'
import { LoadingController } from '@ionic/angular'
import { Observable } from 'rxjs'
import { first } from 'rxjs/operators'

@Component({
  selector: 'server-notifications',
  templateUrl: 'server-notifications.page.html',
  styleUrls: ['server-notifications.page.scss'],
})
export class ServerNotificationsPage {
  error = ''
  loading = true
  notifications: S9Notification[] = []
  page = 1
  needInfinite = false
  readonly perPage = 20
  server$: Observable<S9Server>
  serverId: string

  constructor (
    private readonly route: ActivatedRoute,
    private readonly serverModel: ServerModel,
    private readonly serverService: ServerService,
    private readonly loadingCtrl: LoadingController,
  ) { }

  async ngOnInit () {
    this.serverId = this.route.snapshot.paramMap.get('serverId') as string
    this.server$ = this.serverModel.watch(this.serverId)

    this.server$.pipe(first()).subscribe(async s => {
      this.notifications = await this.getNotifications()
      this.serverModel.update(s.id, { badge: 0 })
    })
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
      notifications = await this.serverService.getNotifications(this.serverId, this.page, this.perPage)
      this.needInfinite = notifications.length >= this.perPage
      this.page++
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
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

  async remove (notificationId: string, index: number): Promise<void> {
    const loader = await this.loadingCtrl.create({
      message: 'Deleting...',
      spinner: 'lines',
      cssClass: 'loader',
    })
    await loader.present()

    try {
      await this.serverService.deleteNotification(this.serverId, notificationId)
      this.notifications.splice(index, 1)
    } catch (e) {
      this.error = e.message
    } finally {
      await loader.dismiss()
    }
  }
}

