import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { AdvancedPage } from './advanced.page'

const routes: Routes = [
  {
    path: '',
    component: AdvancedPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AdvancedPage],
})
export class AdvancedPageModule { }
