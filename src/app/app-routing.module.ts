import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'connect',
    pathMatch: 'full',
  },
  {
    path: 'connect',
    loadChildren: () => import('./pages/connect/connect.module').then(m => m.ConnectPageModule),
  },
  {
    path: 'complete',
    loadChildren: () => import('./pages/complete/complete.module').then(m => m.CompletePageModule),
  },
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
