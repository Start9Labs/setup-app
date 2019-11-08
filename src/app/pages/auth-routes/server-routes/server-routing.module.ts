import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'agent',
    pathMatch: 'full',
  },
  {
    path: 'agent',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'agent/apps',
    loadChildren: () => import('./available-apps/available-apps.module').then(m => m.AvailableAppsPageModule),
  },
  {
    path: ':appId',
    loadChildren: () => import('./app-show/app-show.module').then(m => m.AppShowPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }