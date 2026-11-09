import { CanActivateFn } from '@angular/router';

/**
 * TPI SASI — HTTPS seletivo.
 *
 * Nas rotas sensíveis (login, checkout, conta, pedidos, admin) o navegador precisa
 * estar em HTTPS. Como a SPA navega no cliente, o requiresChannel do backend não é
 * acionado numa navegação interna — então este guard força o salto para o conector
 * HTTPS (porta 8443) quando a página está sendo servida pelo conector HTTP (porta 8080).
 *
 * Só age no deploy do trabalho (porta 8080 -> 8443). Em `ng serve` (4200) e na Vercel
 * (443) ele é inerte, não quebrando o desenvolvimento nem o deploy público.
 */
export const secureChannelGuard: CanActivateFn = (_route, state) => {
  if (typeof window === 'undefined') {
    return true;
  }
  const { protocol, hostname, port } = window.location;
  if (protocol === 'http:' && port === '8080') {
    window.location.href = `https://${hostname}:8443${state.url}`;
    return false;
  }
  return true;
};
