import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadChildren: () => import('../pages/auth/dashboard/dashboard.module').then(m => m.DashboardPageModule),
  },
  {
    path: 'setup',
    loadChildren: () => import('../pages/auth/setup/setup.module').then(m => m.SetupPageModule),
  },
  {
    path: 'manage/:id',
    loadChildren: () => import('../pages/auth/manage/manage.module').then(m => m.ManagePageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }