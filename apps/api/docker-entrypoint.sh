#!/bin/sh
set -e

# FALLBACK de última instância: se JWT_SECRET não foi fornecido (ou veio com o
# placeholder de dev), gera um segredo aleatório efêmero para ESTE container.
# Garante que a API nunca sobe com um secret público/conhecido.
#
# ATENÇÃO: um secret gerado aqui é PER-CONTAINER — não sobrevive a restart e NÃO
# é compartilhado entre réplicas. Com mais de uma instância, um token emitido por
# uma réplica é rejeitado pelas outras. Para escalar horizontalmente, forneça um
# JWT_SECRET fixo e compartilhado via ambiente (o docker-compose já faz isso pelo
# env_file). Este caminho serve só para uma única instância.
PLACEHOLDER="placeholder-value-used-only-for-local-dev-not-a-real-key"
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "$PLACEHOLDER" ]; then
  JWT_SECRET="$(node -e 'process.stdout.write(require("crypto").randomBytes(48).toString("hex"))')"
  export JWT_SECRET
  echo "[entrypoint] AVISO: JWT_SECRET ausente/placeholder; gerei um segredo efêmero PER-CONTAINER. Não use assim com múltiplas réplicas — defina um JWT_SECRET compartilhado para escalar." >&2
fi

exec "$@"
