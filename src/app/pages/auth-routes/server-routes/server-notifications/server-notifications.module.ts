import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { ServerNotificationsPage } from './server-notifications.page'

const routes: Routes = [
  {
    path: '',
    component: ServerNotificationsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerNotificationsPage],
})
export class ServerNotificationsPageModule { }
