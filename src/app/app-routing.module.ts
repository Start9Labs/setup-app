import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './pages/auth-routes/auth.guard'
import { UnauthGuard } from './pages/unauth-routes/unauth.guard'

const routes: Routes = [
  {
    path: 'auth',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/auth-routes/auth-routing.module').then(m => m.AuthRoutingModule),
  },
  {
    path: 'unauth',
    canActivate: [UnauthGuard],
    loadChildren: () => import('./pages/unauth-routes/unauth-routing.module').then(m => m.UnauthRoutingModule),
  },
  {
    path: 'authenticate',
    loadChildren: () => import('./modals/authenticate/authenticate.module').then(m => m.AuthenticatePageModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
