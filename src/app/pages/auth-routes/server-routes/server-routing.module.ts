import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'specs',
    loadChildren: () => import('./server-specs/server-specs.module').then(m => m.ServerSpecsPageModule),
  },
  {
    path: 'developer-options',
    loadChildren: () => import('./developer-options/developer-options.module').then(m => m.DeveloperOptionsPageModule),
  },
  {
    path: 'developer-options/ssh-keys',
    loadChildren: () => import('./ssh-keys/ssh-keys.module').then(m => m.SSHKeysPageModule),
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
    path: 'apps/installed/start9-agent',
    loadChildren: () => import('./start9-agent/start9-agent.module').then(m => m.Start9AgentPageModule),
  },
  {
    path: 'apps/installed/:appId',
    loadChildren: () => import('./app-installed-show/app-installed-show.module').then(m => m.AppInstalledShowPageModule),
  },
  {
    path: 'apps/installed/:appId/config',
    loadChildren: () => import('./app-config/app-config.module').then(m => m.AppConfigPageModule),
  },
  {
    path: 'apps/installed/:appId/logs',
    loadChildren: () => import('./app-logs/app-logs.module').then(m => m.AppLogsPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }