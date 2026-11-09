export const environment = {
  production: true,
  // Vazio = mesma origem: as chamadas viram /api/... e /auth/..., e o vercel.json
  // faz o proxy (rewrite) para o backend real. Mantém o cookie de refresh SameSite=Strict
  // funcionando (mesmo site) e dispensa CORS.
  apiUrl: '',
};
