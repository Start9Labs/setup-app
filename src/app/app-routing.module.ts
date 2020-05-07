import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './pages/auth-routes/auth.guard'
import { UnauthGuard } from './pages/unauth-routes/unauth.guard'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
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
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, initialNavigation: false }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
