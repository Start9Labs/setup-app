import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppAvailableShowPage } from './app-available-show.page'

const routes: Routes = [
  {
    path: '',
    component: AppAvailableShowPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AppAvailableShowPage],
})
export class AppAvailableShowPageModule { }
