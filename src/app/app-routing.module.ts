import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './pages/auth/auth.guard'
import { UnauthGuard } from './pages/unauth/unauth.guard'

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/auth/auth-routing.module').then(m => m.AuthRoutingModule),
  },
  {
    path: 'welcome',
    canActivate: [UnauthGuard],
    loadChildren: () => import('./pages/unauth/unauth-routing.module').then(m => m.UnauthRoutingModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
