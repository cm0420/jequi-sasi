# Tutorial OpenSSL — certificado digital do Jequí (TPI SASI)

Este tutorial explica, comando a comando, como o projeto gera seu próprio certificado
digital com **OpenSSL** e como o navegador passa a confiar nele. Tudo é feito **offline**,
na sua máquina — nenhuma autoridade paga ou serviço externo é usado.

O script `certs/generate-certs.sh` executa esses passos de uma vez. Aqui destrinchamos o
porquê de cada um.

---

## 1. Conceitos em uma frase

- **Chave privada** (`*.key`): número secreto do servidor. Nunca sai da máquina, nunca vai
  pro git.
- **Certificado** (`*.crt`): documento público que diz "esta chave pública pertence a
  `localhost`", assinado por alguém de confiança.
- **CA (Autoridade Certificadora)**: quem assina o certificado. Na internet é uma empresa
  (Let's Encrypt, DigiCert...). Aqui **nós mesmos** somos a CA — criamos uma CA local só
  para o trabalho.
- **CSR (Certificate Signing Request)**: pedido de assinatura que o servidor manda para a
  CA.
- **PKCS#12 / `.p12`**: um "pacote" que junta a chave privada + o certificado num arquivo
  só, no formato que o Spring Boot lê.

O fluxo é: **crio uma CA → o servidor pede um certificado (CSR) → a CA assina → empacoto
no `.p12`**.

---

## 2. Verifique o OpenSSL

```bash
openssl version
```

Deve mostrar algo como `OpenSSL 3.x`. Se não tiver, instale (`sudo dnf install openssl`
no Fedora, `sudo apt install openssl` no Debian/Ubuntu).

---

## 3. Criar a Autoridade Certificadora (CA)

### 3.1. Chave privada da CA

```bash
openssl genrsa -out ca.key 4096
```

- `genrsa` gera um par de chaves RSA.
- `-out ca.key` grava a chave privada.
- `4096` é o tamanho em bits — a CA usa uma chave grande porque ela é a raiz da confiança.

### 3.2. Certificado autoassinado da CA

```bash
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/C=BR/ST=Minas Gerais/L=Diamantina/O=Jequi Artesanatos do Vale/OU=Seguranca/CN=Jequi Root CA" \
  -out ca.crt
```

- `req -x509`: cria um certificado X.509 direto (sem passar por CSR) — é o que caracteriza
  um certificado **autoassinado**, apropriado para a raiz.
- `-new -key ca.key`: usa a chave criada no passo anterior.
- `-nodes`: "no DES", ou seja, não protege a chave com senha (facilita o uso local).
- `-sha256`: algoritmo de hash da assinatura.
- `-days 3650`: validade de 10 anos.
- `-subj "..."`: os dados do titular. `CN=Jequi Root CA` é o nome da nossa CA.
- Saída: `ca.crt`, o certificado público da CA (é este que você importa no navegador).

---

## 4. Criar o certificado do servidor (`localhost`)

### 4.1. Chave privada do servidor

```bash
openssl genrsa -out server.key 2048
```

2048 bits é o suficiente para um certificado de servidor.

### 4.2. Pedido de assinatura (CSR)

```bash
openssl req -new -key server.key \
  -subj "/C=BR/ST=Minas Gerais/L=Diamantina/O=Jequi Artesanatos do Vale/OU=TI/CN=localhost" \
  -out server.csr
```

- `req -new`: cria um **CSR** (ainda não é certificado, é o pedido).
- `CN=localhost`: o nome de domínio que o certificado vai proteger. Como o sistema roda
  localmente, o domínio é `localhost`.
- Saída: `server.csr`.

### 4.3. Extensões — SAN (Subject Alternative Name)

Navegadores modernos **ignoram o CN** e exigem o domínio no campo **SAN**. Sem isso, o
Chrome recusa o certificado com `ERR_CERT_COMMON_NAME_INVALID`. Criamos um arquivo de
extensões:

```bash
cat > server.ext <<EOF
subjectAltName = DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
EOF
```

- `subjectAltName`: lista os nomes válidos — `localhost` e o IP `127.0.0.1`.
- `extendedKeyUsage = serverAuth`: diz que o certificado serve para autenticar um
  **servidor** (TLS).
- `keyUsage`: usos permitidos da chave.

### 4.4. A CA assina o certificado do servidor

```bash
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 825 -sha256 -extfile server.ext
```

- `x509 -req`: pega um CSR e produz um certificado assinado.
- `-in server.csr`: o pedido do servidor.
- `-CA ca.crt -CAkey ca.key`: assina usando a **nossa CA** (certificado + chave).
- `-CAcreateserial`: cria um número de série (arquivo `.srl`).
- `-days 825`: validade de 825 dias — limite que os navegadores aceitam para certificados
  de servidor.
- `-extfile server.ext`: aplica o SAN definido acima.
- Saída: `server.crt`, o certificado do servidor **assinado pela CA**.

---

## 5. Empacotar em PKCS#12 para o Spring Boot

O Spring Boot não lê `.key` + `.crt` soltos; ele lê um keystore. Juntamos tudo:

```bash
openssl pkcs12 -export -name jequi \
  -inkey server.key -in server.crt -certfile ca.crt \
  -out keystore.p12 -passout pass:changeit
```

- `pkcs12 -export`: cria um arquivo PKCS#12.
- `-name jequi`: o "alias" (apelido) da entrada dentro do keystore. O
  `application-sasi.yml` aponta para ele em `server.ssl.key-alias: jequi`.
- `-inkey server.key -in server.crt`: a chave e o certificado do servidor.
- `-certfile ca.crt`: inclui também a CA na cadeia.
- `-passout pass:changeit`: senha do keystore (troque por variável de ambiente
  `KEYSTORE_PASSWORD` em outros ambientes).
- Saída: `keystore.p12`.

É este `keystore.p12` que o Spring usa para servir HTTPS na porta 8443:

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: file:../certs/keystore.p12
    key-store-type: PKCS12
    key-store-password: ${KEYSTORE_PASSWORD:changeit}
    key-alias: jequi
```

---

## 6. Confiar na CA no navegador

Como a CA é nossa (e não uma empresa conhecida), o navegador não a conhece e mostra um
aviso. Para remover o alerta, importe o **`ca.crt`** (nunca o `.key`!) como autoridade
confiável:

- **Chrome/Edge:** Configurações → Privacidade e segurança → Segurança → Gerenciar
  certificados → aba "Autoridades" → Importar → selecione `ca.crt` → marque "confiar para
  identificar sites".
- **Firefox:** Configurações → Privacidade e Segurança → Certificados → Ver certificados →
  aba "Autoridades" → Importar → selecione `ca.crt`.

Depois disso, `https://localhost:8443` abre com o cadeado, sem aviso.

> Importa-se apenas o **certificado da CA** (`ca.crt`). A chave privada (`ca.key`,
> `server.key`) permanece secreta e local.

---

## 7. Conferir o que foi gerado

```bash
# Ver os dados e o SAN do certificado do servidor:
openssl x509 -in server.crt -noout -text | grep -A1 "Subject Alternative Name"

# Confirmar que a CA realmente assinou o servidor:
openssl verify -CAfile ca.crt server.crt   # deve responder: server.crt: OK

# Listar o conteúdo do keystore:
openssl pkcs12 -info -in keystore.p12 -nokeys -passin pass:changeit
```

---

## 8. Resumo dos arquivos

| Arquivo | O que é | Vai pro git? |
|---|---|---|
| `ca.key` | chave privada da CA | **não** (secreto) |
| `ca.crt` | certificado público da CA (importar no navegador) | não* |
| `server.key` | chave privada do servidor | **não** (secreto) |
| `server.crt` | certificado do servidor, assinado pela CA | não* |
| `keystore.p12` | chave + cert do servidor, lido pelo Spring | **não** (contém a chave) |

\* Estão no `.gitignore`: cada avaliador roda `generate-certs.sh` e gera os seus.
