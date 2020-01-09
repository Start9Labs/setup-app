import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { DeveloperOptionsPage } from './developer-options.page'

const routes: Routes = [
  {
    path: '',
    component: DeveloperOptionsPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [DeveloperOptionsPage],
})
export class DeveloperOptionsPageModule { }
