import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AvailableAppShowPage } from './available-app-show.page'

const routes: Routes = [
  {
    path: '',
    component: AvailableAppShowPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AvailableAppShowPage],
})
export class AvailableAppShowPageModule { }
