import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppConfigPage } from './app-config.page'
import { AppConfigNestedPage } from '../app-config-nested/app-config-nested.page'

const routes: Routes = [
  {
    path: '',
    component: AppConfigPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  entryComponents: [AppConfigNestedPage],
  declarations: [AppConfigPage, AppConfigNestedPage],
})
export class AppConfigPageModule { }
