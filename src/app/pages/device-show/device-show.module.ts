import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Routes, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { DeviceShowPage } from './device-show.page'

const routes: Routes = [
  {
    path: '',
    component: DeviceShowPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [DeviceShowPage],
})
export class DeviceShowPageModule { }
