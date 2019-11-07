import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { AuthGuard } from './auth.guard'
import { UnauthGuard } from './unauth.guard'

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('./auth-routing.module').then(m => m.AuthRoutingModule),
  },
  {
    path: 'welcome',
    canActivate: [UnauthGuard],
    loadChildren: () => import('./unauth-routing.module').then(m => m.UnauthRoutingModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
