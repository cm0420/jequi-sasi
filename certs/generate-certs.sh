#!/usr/bin/env bash
#
# Gera os certificados e chaves do Jequí usando OpenSSL, para o TPI SASI.
#
# Cria uma Autoridade Certificadora (CA) própria e um certificado de servidor
# assinado por ela, válido para https://localhost. No fim, empacota a chave e o
# certificado do servidor em um keystore PKCS#12 que o Spring Boot consome.
#
# Uso:  cd certs && ./generate-certs.sh
#
set -euo pipefail
cd "$(dirname "$0")"

PASS="${KEYSTORE_PASSWORD:-changeit}"
ORG="Jequi Artesanatos do Vale"
DAYS_CA=3650      # CA vale 10 anos
DAYS_SRV=825      # certificado de servidor: 825 dias (limite aceito pelos navegadores)

echo "==> 1/5  Chave privada + certificado da CA (raiz)"
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days "$DAYS_CA" \
  -subj "/C=BR/ST=Minas Gerais/L=Diamantina/O=${ORG}/OU=Seguranca/CN=Jequi Root CA" \
  -out ca.crt

echo "==> 2/5  Chave privada do servidor"
openssl genrsa -out server.key 2048

echo "==> 3/5  Requisição de assinatura (CSR) do servidor"
openssl req -new -key server.key \
  -subj "/C=BR/ST=Minas Gerais/L=Diamantina/O=${ORG}/OU=TI/CN=localhost" \
  -out server.csr

echo "==> 4/5  Assina o certificado do servidor com a CA (com SAN p/ localhost)"
cat > server.ext <<EOF
subjectAltName = DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
keyUsage = digitalSignature, keyEncipherment
EOF
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days "$DAYS_SRV" -sha256 -extfile server.ext

echo "==> 5/5  Empacota chave+cert do servidor em PKCS#12 (para o Spring Boot)"
openssl pkcs12 -export -name jequi \
  -inkey server.key -in server.crt -certfile ca.crt \
  -out keystore.p12 -passout pass:"${PASS}"

rm -f server.csr server.ext ca.srl
echo
echo "OK. Arquivos gerados em: $(pwd)"
echo "  ca.crt        -> importe no navegador como Autoridade Confiável (tira o alerta de certificado)"
echo "  server.crt    -> certificado do servidor (assinado pela CA)"
echo "  server.key    -> chave privada do servidor (NÃO versionar)"
echo "  keystore.p12  -> keystore usado pelo backend (senha: ${PASS})"
