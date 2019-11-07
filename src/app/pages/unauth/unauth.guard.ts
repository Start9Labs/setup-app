import { Injectable } from '@angular/core'
import { CanActivate, Router } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Injectable({
  providedIn: 'root',
})
export class UnauthGuard implements CanActivate {

  constructor (
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  canActivate (): boolean {
    if (this.authService.isAuthenticated) {
      this.router.navigate([''])
      return false
    }
    return true
  }

}
