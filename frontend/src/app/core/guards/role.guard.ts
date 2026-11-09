import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';
import { Role } from '../models/auth.model';

export function roleGuard(allowedRole: Role): CanMatchFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.role() === allowedRole) {
      return true;
    }

    return router.createUrlTree(['/login']);
  };
}
