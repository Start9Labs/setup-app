import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { ServerShowPage } from './server-show.page'
import { StatusComponentModule } from 'src/app/components/status/status.components.module'
import { VarDirective } from 'src/app/util/ng-var.directive'

const routes: Routes = [
  {
    path: '',
    component: ServerShowPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    StatusComponentModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerShowPage, VarDirective],
})
export class ServerShowPageModule { }
