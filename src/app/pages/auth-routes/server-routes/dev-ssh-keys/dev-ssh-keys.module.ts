import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { RouterModule, Routes } from '@angular/router'
import { DevSSHKeysPage } from './dev-ssh-keys.page'

const routes: Routes = [
  {
    path: '',
    component: DevSSHKeysPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [DevSSHKeysPage],
})
export class DevSSHKeysPageModule { }
