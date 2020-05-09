import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { SetupPage } from './setup.page'
import { NgVarDirectiveModule } from 'src/app/directives/ngvar.directive.module'

const routes: Routes = [
  {
    path: '',
    component: SetupPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    NgVarDirectiveModule,
  ],
  declarations: [SetupPage],
})
export class SetupPageModule { }
