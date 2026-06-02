#!/bin/sh
set -e

# Se JWT_SECRET não foi fornecido (ou veio com o placeholder de dev), gera um
# segredo aleatório efêmero para este container. Assim `docker compose up`
# funciona sem setup E sem rodar com um secret público/conhecido. Tokens
# emitidos não sobrevivem a um restart do container — aceitável p/ sessões de 1h.
PLACEHOLDER="placeholder-value-used-only-for-local-dev-not-a-real-key"
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "$PLACEHOLDER" ]; then
  JWT_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(48).toString("hex"))')"
  export JWT_SECRET
  echo "[entrypoint] JWT_SECRET ausente ou placeholder; gerado um segredo aleatório efêmero para este container."
fi

exec "$@"
