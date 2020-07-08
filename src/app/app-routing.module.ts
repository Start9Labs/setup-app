import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'devices',
    pathMatch: 'full',
  },
  {
    path: 'devices',
    loadChildren: () => import('./pages/device-list/device-list.module').then(m => m.DeviceListPageModule),
  },
  {
    path: 'devices/:deviceId',
    loadChildren: () => import('./pages/device-show/device-show.module').then(m => m.DeviceShowPageModule),
  },
  {
    path: 'connect',
    loadChildren: () => import('./pages/connect/connect.module').then(m => m.ConnectPageModule),
  },
  {
    path: 'setup',
    loadChildren: () => import('./pages/setup/setup.module').then(m => m.SetupPageModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
