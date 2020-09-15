import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { SuccessPage } from './success.page'

const routes: Routes = [
  {
    path: '',
    component: SuccessPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [SuccessPage],
})
export class SuccessPageModule { }
