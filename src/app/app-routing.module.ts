import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { RouterGuard } from './router-guard.guard'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'devices',
    pathMatch: 'full',
  },
  {
    path: 'devices',
    canActivate: [RouterGuard],
    loadChildren: () => import('./pages/device-list/device-list.module').then(m => m.DeviceListPageModule),
  },
  {
    path: 'devices/:productKey',
    loadChildren: () => import('./pages/device-show/device-show.module').then(m => m.DeviceShowPageModule),
  },
  {
    path: 'devices/:productKey/success',
    loadChildren: () => import('./pages/success/success.module').then(m => m.SuccessPageModule),
  },
  {
    path: 'connect',
    loadChildren: () => import('./pages/connect/connect.module').then(m => m.ConnectPageModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
