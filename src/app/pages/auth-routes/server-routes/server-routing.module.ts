import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'apps/available',
    loadChildren: () => import('./available-apps-list/available-apps-list.module').then(m => m.AvailableAppsListPageModule),
  },
  {
    path: 'apps/available/:appId',
    loadChildren: () => import('./app-preview/app-preview.module').then(m => m.AppPreviewPageModule),
  },
  {
    path: 'apps/start9Agent',
    loadChildren: () => import('./start9-agent/start9-agent.module').then(m => m.Start9AgentPageModule),
  },
  {
    path: 'apps/:appId',
    loadChildren: () => import('./available-app-show/available-app-show.module').then(m => m.AvailableAppShowPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }