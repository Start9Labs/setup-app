import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardPageModule),
  },
  {
    path: 'setup',
    loadChildren: () => import('./pages/setup/setup.module').then(m => m.SetupPageModule),
  },
  {
    path: 'manage/:ssid',
    loadChildren: () => import('./pages/manage/manage.module').then(m => m.ManagePageModule),
  },
  {
    path: 'manage/:ssid/wifi',
    loadChildren: () => import('./pages/wifi/wifi.module').then(m => m.WifiPageModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
