import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'servers',
    pathMatch: 'full',
  },
  {
    path: 'servers',
    loadChildren: () => import('./server-list/server-list.module').then(m => m.ServerListPageModule),
  },
  {
    path: 'servers/setup',
    loadChildren: () => import('./setup/setup.module').then(m => m.SetupPageModule),
  },
  {
    path: 'servers/:id',
    loadChildren: () => import('./server-show/server-show.module').then(m => m.ServerShowPageModule),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }