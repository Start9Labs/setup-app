import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AvailableAppsPage } from './available-apps.page'

const routes: Routes = [
  {
    path: '',
    component: AvailableAppsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AvailableAppsPage],
})
export class AvailableAppsPageModule { }
