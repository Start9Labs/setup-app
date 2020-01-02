import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { ServerSpecsPage } from './server-specs.page'

const routes: Routes = [
  {
    path: '',
    component: ServerSpecsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerSpecsPage],
})
export class ServerSpecsPageModule { }
