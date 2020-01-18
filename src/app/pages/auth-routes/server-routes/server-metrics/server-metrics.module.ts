import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { ServerMetricsPage } from './server-metrics.page'

const routes: Routes = [
  {
    path: '',
    component: ServerMetricsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerMetricsPage],
})
export class ServerMetricsPageModule { }
