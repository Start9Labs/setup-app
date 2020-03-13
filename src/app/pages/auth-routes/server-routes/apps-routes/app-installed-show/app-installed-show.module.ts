import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { AppInstalledShowPage } from './app-installed-show.page'
import { StatusComponentModule } from 'src/app/components/status/status.components.module'
import { NgVarDirectiveModule } from 'src/app/directives/ngvar.directive.module'

const routes: Routes = [
  {
    path: '',
    component: AppInstalledShowPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    StatusComponentModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    NgVarDirectiveModule,
  ],
  declarations: [AppInstalledShowPage],
})
export class AppInstalledShowPageModule { }
