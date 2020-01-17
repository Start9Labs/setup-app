import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppConfigPage } from './app-config.page'
import { ObjectConfigComponentModule } from 'src/app/components/object-config/object-config.components.module'
import { AppConfigNestedPageModule } from '../../../../../modals/app-config-nested/app-config-nested.module'
import { AppConfigValuePageModule } from 'src/app/modals/app-config-value/app-config-value.module'

const routes: Routes = [
  {
    path: '',
    component: AppConfigPage,
  },
]

@NgModule({
  imports: [
    AppConfigValuePageModule,
    AppConfigNestedPageModule,
    ObjectConfigComponentModule,
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AppConfigPage],
})
export class AppConfigPageModule { }
