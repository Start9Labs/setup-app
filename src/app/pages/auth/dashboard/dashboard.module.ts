import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Routes, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { DashboardPage } from './dashboard.page'

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [DashboardPage],
})
export class DashboardPageModule { }
