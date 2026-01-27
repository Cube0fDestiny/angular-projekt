import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, take } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn$().pipe(
    take(1),
    map(isLoggedIn => {
      return isLoggedIn
        ? router.createUrlTree(['/home'])
        : true;
    })
  );
};
