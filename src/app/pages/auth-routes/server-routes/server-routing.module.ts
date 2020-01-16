import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'notifications',
    loadChildren: () => import('./server-notifications/server-notifications.module').then(m => m.ServerNotificationsPageModule),
  },
  {
    path: 'specs',
    loadChildren: () => import('./server-specs/server-specs.module').then(m => m.ServerSpecsPageModule),
  },
  {
    path: 'apps',
    loadChildren: () => import('./apps-routes/apps-routing.module').then(m => m.AppsRoutingModule),
  },
  {
    path: 'developer-options',
    loadChildren: () => import('./dev-options/dev-options.module').then(m => m.DevOptionsPageModule),
  },
  {
    path: 'developer-options/ssh-keys',
    loadChildren: () => import('./dev-ssh-keys/dev-ssh-keys.module').then(m => m.DevSSHKeysPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServerRoutingModule { }