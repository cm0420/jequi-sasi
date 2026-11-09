import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const api = environment.apiUrl;
  const tokens = { accessToken: 'novo', tokenType: 'Bearer', expiresIn: 3600 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('renova o token no 401 e repete a requisição com o token novo', () => {
    let body: unknown;
    http.get(`${api}/api/orders/me`).subscribe((b) => (body = b));

    backend.expectOne(`${api}/api/orders/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/auth/refresh`).flush(tokens);
    const retry = backend.expectOne(`${api}/api/orders/me`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer novo');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('vários 401 simultâneos disparam um refresh só', () => {
    http.get(`${api}/a`).subscribe();
    http.get(`${api}/b`).subscribe();
    backend.expectOne(`${api}/a`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/b`).flush(null, { status: 401, statusText: 'Unauthorized' });

    backend.expectOne(`${api}/auth/refresh`).flush(tokens); // expectOne falha se houver dois
    backend.expectOne(`${api}/a`).flush({});
    backend.expectOne(`${api}/b`).flush({});
  });

  it('refresh falhou: devolve o 401 original sem tentar de novo', () => {
    let status = 0;
    http.get(`${api}/api/orders/me`).subscribe({ error: (e) => (status = e.status) });

    backend.expectOne(`${api}/api/orders/me`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/auth/refresh`).flush(null, { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(401);
  });

  it('401 em /auth/* (senha errada) não tenta renovar', () => {
    let status = 0;
    http.post(`${api}/auth/login`, {}).subscribe({ error: (e) => (status = e.status) });
    backend.expectOne(`${api}/auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
  });
});
