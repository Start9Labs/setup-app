import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'available',
    pathMatch: 'full',
  },
  {
    path: 'available',
    loadChildren: () => import('./app-available-list/app-available-list.module').then(m => m.AppAvailableListPageModule),
  },
  {
    path: 'available/:appId',
    loadChildren: () => import('./app-available-show/app-available-show.module').then(m => m.AppAvailableShowPageModule),
  },
  {
    path: 'installed/:appId',
    loadChildren: () => import('./app-installed-show/app-installed-show.module').then(m => m.AppInstalledShowPageModule),
  },
  {
    path: 'installed/:appId/config',
    loadChildren: () => import('./app-config/app-config.module').then(m => m.AppConfigPageModule),
  },
  {
    path: 'installed/:appId/logs',
    loadChildren: () => import('./app-logs/app-logs.module').then(m => m.AppLogsPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppsRoutingModule { }