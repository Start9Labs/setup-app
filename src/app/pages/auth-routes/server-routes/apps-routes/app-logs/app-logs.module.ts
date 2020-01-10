import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppLogsPage } from './app-logs.page'

const routes: Routes = [
  {
    path: '',
    component: AppLogsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AppLogsPage],
})
export class AppLogsPageModule { }
