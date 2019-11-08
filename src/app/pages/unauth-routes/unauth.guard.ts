import { Injectable } from '@angular/core'
import { CanActivate } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Injectable({
  providedIn: 'root',
})
export class UnauthGuard implements CanActivate {

  constructor (
    private readonly authService: AuthService,
  ) { }

  canActivate (): boolean {
    return !this.authService.isAuthenticated()
  }

}
