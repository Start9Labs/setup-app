import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'apps/agent',
    pathMatch: 'full',
  },
  {
    path: 'apps/agent',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'apps/available',
    loadChildren: () => import('./available-apps/available-apps.module').then(m => m.AvailableAppsPageModule),
  },
  {
    path: 'apps/available/:appId',
    loadChildren: () => import('./app-preview/app-preview.module').then(m => m.AppPreviewPageModule),
  },
  {
    path: 'apps/:appId',
    loadChildren: () => import('./app-show/app-show.module').then(m => m.AppShowPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }