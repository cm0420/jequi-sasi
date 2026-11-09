# Jequí — artesanatos do vale · versão TPI SASI

Loja de artesanato (cerâmica/barro do Vale do Jequitinhonha) usada como entrega do
**Trabalho Prático Individual de Segurança (TPI SASI)**. É o mesmo sistema da loja, mas
com um recorte de segurança: **HTTPS seletivo com certificado gerado por OpenSSL**.

> Monorepo: `backend/` (Spring Boot) + `frontend/` (Angular) + `certs/` (scripts OpenSSL)
> + `docs/` (tutorial OpenSSL).

---

## O que este trabalho demonstra

- **Certificado digital próprio, feito com OpenSSL** — uma Autoridade Certificadora (CA)
  local assina o certificado do servidor `localhost`. Passo a passo em
  [`docs/tutorial-openssl.md`](docs/tutorial-openssl.md).
- **HTTPS só onde é necessário (não global).** As páginas públicas (institucional,
  catálogo) ficam em **HTTP (porta 8080)**. As páginas e APIs sensíveis — login, cadastro,
  checkout, pedidos, conta, admin — são forçadas para **HTTPS (porta 8443)**.
  - No backend: `requiresChannel(...).requiresSecure()` apenas nas rotas sensíveis
    (`SecurityConfig`), com dois conectores Tomcat (`SasiServerConfig`).
  - No frontend: `secureChannelGuard` salta do conector HTTP para o HTTPS ao entrar numa
    rota sensível.
- **Página social/institucional** (HTTP) com a empresa e a **política de segurança**, e
  botão que leva ao login em HTTPS: `/politica-de-seguranca`.

> Não é HTTPS global de propósito: forçar HTTPS no site inteiro contraria o enunciado.

---

## Pré-requisitos

| Ferramenta | Para quê | Obrigatório |
|---|---|---|
| **Java 21** (Temurin) | rodar o backend | sim |
| **OpenSSL** | gerar o certificado | sim |
| **Docker** + Docker Compose | subir o PostgreSQL automaticamente | sim* |
| **Node 20+** | só se for **recompilar** o frontend | não |

\* O backend usa o *Docker Compose Support* do Spring: ao iniciar, ele sobe um PostgreSQL
sozinho a partir do `backend/compose.yaml`. Se preferir um Postgres próprio, veja
"Banco manual" no fim.

O frontend **já vem compilado** em `backend/src/main/resources/static/`, então para
avaliar o trabalho **não é preciso Node**.

---

## Como rodar (3 passos)

### 1. Gerar o certificado com OpenSSL

```bash
cd certs
./generate-certs.sh
cd ..
```

Isso cria a CA, o certificado do servidor e o `keystore.p12` que o backend usa.
(Detalhe de cada comando em [`docs/tutorial-openssl.md`](docs/tutorial-openssl.md).)

### 2. (Opcional) Confiar na CA no navegador

Importe `certs/ca.crt` como **Autoridade Certificadora confiável** no seu navegador para
tirar o alerta de "certificado não confiável" em `https://localhost:8443`. Sem isso, o
site funciona igual — o navegador só mostra um aviso que você aceita manualmente.

### 3. Subir o backend (perfil `sasi`)

```bash
cd backend
SPRING_PROFILES_ACTIVE=sasi ./mvnw spring-boot:run
```

Pronto. Acesse:

- **http://localhost:8080** — página pública (catálogo, institucional). Fica em HTTP.
- Ao clicar em **Entrar / Checkout / Minha conta**, o navegador é levado para
  **https://localhost:8443** automaticamente.
- **https://localhost:8443/politica-de-seguranca** — também acessível direto.

---

## Recompilar o frontend (opcional)

Só é necessário se você mexer no código Angular:

```bash
cd frontend
npm ci
npm run build -- --configuration production
# copie o resultado para dentro do backend:
rm -rf ../backend/src/main/resources/static/*
cp -r dist/frontend-projeto-tadeu/browser/. ../backend/src/main/resources/static/
```

---

## Estrutura

```
jequi-sasi/
├── backend/     Spring Boot (Java 21). Perfil `sasi` = HTTPS seletivo.
│   └── src/main/resources/static/   SPA Angular já compilada
├── frontend/    Angular 19 (código-fonte da SPA)
├── certs/       generate-certs.sh (OpenSSL) — gera CA + cert + keystore.p12
└── docs/        tutorial-openssl.md
```

### Arquivos-chave da segurança

| Arquivo | Papel |
|---|---|
| `certs/generate-certs.sh` | gera CA, certificado do servidor e keystore PKCS#12 |
| `backend/.../common/config/SasiServerConfig.java` | conector HTTP (8080) ao lado do HTTPS (8443) |
| `backend/.../security/config/SecurityConfig.java` | `requiresChannel` força HTTPS nas rotas sensíveis |
| `backend/.../common/config/SpaResourceConfig.java` | serve a SPA e faz fallback das rotas do Angular |
| `backend/src/main/resources/application-sasi.yml` | porta 8443 + SSL + flags do perfil |
| `frontend/.../core/guards/secure-channel.guard.ts` | salta do HTTP para o HTTPS nas rotas sensíveis |
| `frontend/.../features/institucional/politica-seguranca.component.ts` | página social + política de segurança |

---

## Banco manual (sem Docker)

Se não quiser usar Docker, suba um PostgreSQL e crie o banco:

```sql
CREATE DATABASE demo;
```

Credenciais padrão (sobrescreva por variáveis de ambiente se precisar):
`DB_HOST=localhost DB_PORT=5432 DB_NAME=demo DB_USERNAME=postgres DB_PASSWORD=postgres`.

As migrações do Flyway criam as tabelas no primeiro start.

---

## Segredos

Nada de senha ou chave fica no código. A senha do keystore e o segredo JWT têm *default*
de desenvolvimento e podem ser trocados por variáveis de ambiente
(`KEYSTORE_PASSWORD`, `JWT_SECRET`). As chaves privadas geradas em `certs/` estão no
`.gitignore` e não vão para o repositório.
