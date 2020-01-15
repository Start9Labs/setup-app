import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.module').then(m => m.WelcomePageModule),
  },
  {
    path: 'create',
    loadChildren: () => import('./keychain-create/keychain-create.module').then(m => m.KeychainCreatePageModule),
  },
  {
    path: 'restore',
    loadChildren: () => import('./keychain-restore/keychain-restore.module').then(m => m.KeychainRestorePageModule),
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UnauthRoutingModule { }