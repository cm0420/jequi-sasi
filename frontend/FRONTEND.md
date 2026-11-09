# Contexto do projeto — Frontend (Tadeu Artesanatos)

Este arquivo define como trabalhar no frontend deste projeto. Leia antes de gerar qualquer componente ou tela.

## Sobre o projeto

Frontend em **Angular** consumindo o backend Spring Boot já implementado (ver `CLAUDE.md` do backend, anexado neste projeto, pra contexto completo de domínio/regras de negócio). Loja de artesanato: navegação de catálogo, carrinho, checkout, pagamento (fake), frete (fake), área do cliente, painel admin.

## Filosofia de trabalho — diferente do backend

No backend, decisões erradas de arquitetura são caras de reverter (schema de banco, módulos inteiros), então parávamos pra documentar e decidir antes de codar. **No frontend isso muda**: tem feedback visual imediato, errar e corrigir é rápido, então o fluxo é diferente:

- **Componente/tela nova → direto no código**, iterando visualmente. Não gerar `.md` descritivo antes de um botão ou uma tela — ver o resultado renderizado é mais rápido que ler descrição.
- **Decisão estrutural que é cara de reverter** (estrutura de pastas, gerenciamento de estado global, como as chamadas de API são organizadas, biblioteca de formulário) — aí sim **para e decide antes**, com perguntas rápidas e diretas, não um documento longo.

## Regras de comportamento — mesmas do backend, aplicadas aqui

- **Nunca corrigir, refatorar, formatar ou alterar nada que não foi explicitamente pedido**, mesmo que pareça um erro ou melhoria óbvia. Apontar e perguntar antes, nunca aplicar direto.
- **Nunca agir por conta própria** fora do que foi pedido — sem adicionar funcionalidades extras, sem instalar dependência não solicitada sem perguntar antes.
- Preferir fixes pontuais a reescritas completas de arquivo/componente.
- Sem prompts de confirmação antes de gerar código na conversa — só confirma antes de decisão estrutural (ver acima) ou antes de instalar pacote novo.

## Stack (o que já está decidido)

- **Angular** (standalone components — sem NgModules, é o padrão moderno recomendado hoje)
- **TypeScript** (nativo do Angular)
- **Tailwind CSS** — estilização
- **Signals** — gerenciamento de estado (nativo do Angular desde a v16+, sem dependência extra — mesmo raciocínio de simplicidade que levou à escolha de Context API quando o plano era React)
- **`HttpClient`** nativo do Angular pra chamadas HTTP — sem axios, não é necessário no Angular
- **Angular Router** — navegação entre telas

## Skill de design disponível

Existe um skill de design engineering (Emil Kowalski — `npx skills add emilkowalski/skill`) com diretrizes de UI/animação pra interfaces mais refinadas. Vale considerar instalar/consultar quando a sessão entrar na parte visual (não é sobre arquitetura, é sobre acabamento de interface). Funciona independente de framework, então continua válido com Angular.

## Contrato com o backend

Backend roda em `http://localhost:8080` (porta fixa; o Postgres por trás dele muda de porta a cada subida via Docker Compose Support, mas isso não afeta o frontend — só a API HTTP importa).

### Autenticação

- `POST /auth/signup` — cadastro completo (User + Customer numa chamada só). Body: `firstName, lastName, email, password, phone, cpf`.
- `POST /auth/login` — Body: `email, password`.
- `POST /auth/refresh` — sem body, usa cookie.
- `POST /auth/logout` — sem body, usa cookie.
- Resposta de login/signup/refresh: `{ accessToken, tokenType, expiresIn }`. Guardar `accessToken` **em memória** (nunca `localStorage`), mandar em todo request autenticado como `Authorization: Bearer <token>`.
- Refresh token vem automaticamente como cookie `HttpOnly`/`Secure`/`SameSite=Strict` — o frontend nunca lê nem manipula esse cookie diretamente, só precisa configurar `withCredentials: true` nas chamadas do `HttpClient` (ou globalmente, via `provideHttpClient(withInterceptors([...]))` + um interceptor que seta isso em toda requisição), pra o navegador incluir o cookie sozinho.
- **CORS**: o backend libera `http://localhost:4200` por padrão (propriedade `app.cors.allowed-origins`, variável `CORS_ALLOWED_ORIGINS`, separada por vírgula). Em produção, definir o domínio real do front.

### Catálogo (público, sem login)

- `GET /api/catalog/pieces` — paginado, filtro opcional `?categoryId=`
- `GET /api/catalog/pieces/{id}`
- `GET /api/catalog/sets` / `GET /api/catalog/sets/{id}` — conjuntos/kits, `availableStock` já vem calculado
- `GET /api/catalog/categories`

### Cliente autenticado (`/api/customers/me/**`, `/api/orders/me/**`)

- Perfil: `GET/PUT /api/customers/me`, endereços em `/api/customers/me/addresses`
- Carrinho: `POST /api/orders/me` (cria/retorna carrinho aberto), `POST /api/orders/me/items`, `PUT/DELETE /api/orders/me/items/{itemId}`
- Checkout: `POST /api/orders/me/checkout` — Body: `{ addressId }`
- Frete: `GET /api/orders/me/{orderId}/shipping/quotes`, `POST /api/orders/me/{orderId}/shipping` — Body: `{ code }`
- Pagamento: `POST /api/orders/me/{orderId}/payments` — Body opcional: `{ simulateOutcome }` (`APPROVED`/`DECLINED`/`PENDING`, default aprovado — é o gateway fake, sem gateway real ainda)
- Histórico: `GET /api/orders/me`, `GET /api/orders/me/{orderId}`
- Estorno: `POST /api/orders/me/{orderId}/refund-request` — Body: `{ reason }`

### Admin (role `ADMIN`)

- CRUD de peça/categoria/conjunto: `/api/catalog/**` (`POST`/`PUT`/`DELETE`)
- Gestão de pedido: `GET /api/orders`, `/api/orders/{id}/ship`, `/deliver`, `/mark-paid`, `/cancel`, `/refund-approve`, `/refund-deny`
- Painel: `GET /api/admin/orders/{id}` (detalhe consolidado), `/api/admin/reports/sales`, `/best-selling-pieces`, `/pending-shipment`
- Ajuste de estoque: `POST /api/admin/pieces/{id}/stock-adjustment` — Body: `{ delta, reason }`

### Erros

Toda resposta de erro segue o mesmo formato:
```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "descrição legível" }
```
Status usados: `400` (validação), `401` (não autenticado/token expirado), `403` (sem permissão), `404` (não encontrado), `409` (conflito de estado — ex: peça esgotada, pedido já pago).

## Referência obrigatória — sempre consultar antes de codar

Todos os `.md` de módulo do backend (`modulo-user-codigo.md`, `modulo-customer-codigo.md`, `modulo-security-codigo.md`, `modulo-catalog-codigo.md`, `modulo-stock-codigo.md`, `modulo-order-codigo.md`, `modulo-payment-codigo.md`, `modulo-shipping-codigo.md`, `modulo-admin-codigo.md`) estão anexados neste projeto. **Antes de implementar qualquer tela ou chamada de API, procurar e ler o `.md` do módulo correspondente** — ele tem o DTO exato (campo por campo, tipo, nome), as regras de negócio, e às vezes decisões de UX que já foram fechadas (ex: fluxo de estorno, frete obrigatório antes de pagar) que a tela precisa refletir. Não presumir formato de request/response, não inventar campo — conferir no `.md` real.

## Boas práticas de organização

- **Separação por pasta clara**, seguindo o mesmo espírito do backend (organização por domínio, não por tipo técnico solto): cada área do domínio (`auth`, `catalog`, `cart`, `checkout`, `orders`, `admin`) em sua própria pasta dentro de `src/app/features/`, com os componentes, serviços e rotas daquele domínio juntos — evitar uma pasta `components/` genérica única com tudo misturado.
- **Componentes standalone**, sem `NgModule` — é o padrão atual do Angular, mais simples de organizar por feature.
- **Reutilização de código**: componentes de UI verdadeiramente genéricos (botão, input, card, modal) ficam em `src/app/shared/ui/`, separados dos componentes específicos de domínio. Lógica de chamada de API repetida (montar header de auth, tratar erro padrão do backend) vira um `HttpInterceptor` único (`src/app/core/interceptors/`) aplicado globalmente, não repetida em cada serviço.
- **Um serviço por domínio** (`CatalogService`, `OrderService`, etc.), injetável via `providedIn: 'root'`, concentrando as chamadas HTTP daquele domínio — componente nunca chama `HttpClient` direto, sempre passa pelo serviço do domínio.
- **Tipagem compartilhada**: interfaces TypeScript que espelham os DTOs do backend (`PieceResponseDto`, `OrderResponseDto`, etc.) ficam centralizadas em `src/app/core/models/`, não redeclaradas em cada componente que os usa.
- Antes de criar um componente novo, checar se já existe algo reutilizável no projeto que resolve — evita duplicação silenciosa.
