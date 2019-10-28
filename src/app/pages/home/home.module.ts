import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { HomePage } from './home.page'
import { APService } from 'src/app/services/ap-service'
import { LANService } from 'src/app/services/lan-service'
import { WifiWizard } from 'src/app/services/wifi-wizard'

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
  providers: [APService, LANService, WifiWizard],
})
export class HomePageModule { }
