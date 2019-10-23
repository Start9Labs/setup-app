import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { HomePage } from './home.page'
import { HttpService } from 'src/app/services/http-service'

const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [HomePage],
  providers: [HttpService],
})
export class HomePageModule { }
