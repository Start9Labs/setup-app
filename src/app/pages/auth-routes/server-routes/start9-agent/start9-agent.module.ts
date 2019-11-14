import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Routes, RouterModule } from '@angular/router'

import { IonicModule } from '@ionic/angular'

import { Start9AgentPage } from './start9-agent.page'

const routes: Routes = [
  {
    path: '',
    component: Start9AgentPage,
  },
]

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [Start9AgentPage],
})
export class Start9AgentPageModule { }
