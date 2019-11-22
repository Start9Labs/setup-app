import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'apps/available',
    loadChildren: () => import('./app-available-list/app-available-list.module').then(m => m.AppAvailableListPageModule),
  },
  {
    path: 'apps/available/:appId',
    loadChildren: () => import('./app-available-show/app-available-show.module').then(m => m.AppAvailableShowPageModule),
  },
  {
    path: 'apps/start9Agent',
    loadChildren: () => import('./start9-agent/start9-agent.module').then(m => m.Start9AgentPageModule),
  },
  {
    path: 'apps/:appId',
    loadChildren: () => import('./app-installed-show/app-installed-show.module').then(m => m.AppInstalledShowPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }