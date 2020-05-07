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
    console.log('UNAUTH GUARD')
    if (this.authService.isVerified()) {
      console.log('denied')
      this.router.navigateByUrl('/auth')
      return false
    } else {
      console.log('allowed')
      return true
    }
  }

}
