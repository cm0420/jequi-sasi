import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './features/auth/auth.service';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideHttpClient(withInterceptors([authInterceptor])),
    // F5 / nova aba: recupera a sessão pelo cookie HttpOnly de refresh antes das rotas
    // rodarem (senão o roleGuard manda para o login). Sem cookie → 400, segue deslogado.
    provideAppInitializer(() => inject(AuthService).refreshOnce().pipe(catchError(() => of(null)))),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
