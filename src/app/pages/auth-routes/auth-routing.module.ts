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
    path: 'servers/:serverId',
    loadChildren: () => import('./server-routes/server-routing.module').then(m => m.ServerRoutingModule),
  },
  {
    path: 'setup',
    loadChildren: () => import('./setup/setup.module').then(m => m.SetupPageModule),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule),
  },
  {
    path: 'settings/passcode',
    loadChildren: () => import('./passcode/passcode.module').then(m => m.PasscodePageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }