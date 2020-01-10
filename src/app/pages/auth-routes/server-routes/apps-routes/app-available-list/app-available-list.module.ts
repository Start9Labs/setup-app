import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppAvailableListPage } from './app-available-list.page'

const routes: Routes = [
  {
    path: '',
    component: AppAvailableListPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AppAvailableListPage],
})
export class AppAvailableListPageModule { }
