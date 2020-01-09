import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { SSHKeysPage } from './ssh-keys.page'

const routes: Routes = [
  {
    path: '',
    component: SSHKeysPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [SSHKeysPage],
})
export class SSHKeysPageModule { }
