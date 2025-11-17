import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.appUser$.pipe(
      take(1),
      map(user => {
        // Si está logueado y es admin → OK
        if (user && user.rol === 'admin') {
          return true;
        }

        // Si no, lo mandamos al home (o al login si prefieres)
        this.router.navigate(['/home']);
        return false;
      })
    );
  }
}
