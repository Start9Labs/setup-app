import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { CompletePage } from './complete.page'

const routes: Routes = [
  {
    path: '',
    component: CompletePage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CompletePage],
})
export class CompletePageModule { }
