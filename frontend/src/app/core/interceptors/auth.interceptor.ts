import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/auth.service';

const withAuth = (req: HttpRequest<unknown>, token: string | null) =>
  req.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

/**
 * Access token expirado → backend responde 401. Renova pelo cookie de refresh
 * e repete a requisição uma vez. /auth/* fica de fora: lá o 401 é senha errada
 * ou refresh inválido, e tentar renovar entraria em loop.
 *
 * Só anexa credenciais (Bearer + cookie) às chamadas da própria API. Requisições
 * a terceiros (ex: ViaCEP) passam intactas — não vaza o token pra fora.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Só a nossa API leva credenciais. Em dev, apiUrl é absoluto (http://localhost:8080).
  // Em prod, apiUrl é '' (mesma origem via proxy do Vercel), então as chamadas são
  // relativas /api|/auth. Terceiros (ex: ViaCEP, URL absoluta) passam intactos.
  const isApiRequest = environment.apiUrl
    ? req.url.startsWith(environment.apiUrl)
    : req.url.startsWith('/api') || req.url.startsWith('/auth');

  if (!isApiRequest) {
    return next(req);
  }

  const authService = inject(AuthService);

  return next(withAuth(req, authService.getAccessToken())).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || req.url.includes('/auth/')) {
        return throwError(() => err);
      }
      return authService.refreshOnce().pipe(
        catchError(() => {
          authService.clearSession();
          return throwError(() => err);
        }),
        switchMap((tokens) => next(withAuth(req, tokens.accessToken))),
      );
    }),
  );
};
