import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Routes, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { ServerListPage } from './server-list.page'

const routes: Routes = [
  {
    path: '',
    component: ServerListPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerListPage],
})
export class ServerListPageModule { }
