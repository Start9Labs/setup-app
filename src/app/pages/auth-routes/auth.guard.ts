import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor (
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  canActivate (): boolean {
    if (this.authService.isMissing()) {
      this.router.navigateByUrl('/unauth')
      return false
    } else {
      return true
    }
  }
}
