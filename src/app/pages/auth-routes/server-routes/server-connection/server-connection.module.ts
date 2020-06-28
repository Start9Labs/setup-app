import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { ServerConnectionPage } from './server-connection.page'

const routes: Routes = [
  {
    path: '',
    component: ServerConnectionPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ServerConnectionPage],
})
export class ServerConnectionPageModule { }
