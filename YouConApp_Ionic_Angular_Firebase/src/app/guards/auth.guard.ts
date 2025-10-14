import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true; // Si hay usuario, permite el acceso
        } else {
          this.router.navigate(['/auth/login']); // Si no hay usuario, redirige al login
          return false;
        }
      })
    );
  }
}