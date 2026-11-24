#!/usr/bin/env bash
set -u

base_url="${SMOKE_BASE_URL:-http://localhost:3000}"
fallos=0

for ruta in \
  / /circuito /calendario /ranking /premios /noticias /puntos \
  /reglamento /faq /contacto /patrocinadores /patrocinadores/historico \
  /jugadores /condiciones /privacidad /cookies /aviso-legal
do
  codigo=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base_url}${ruta}" 2>/dev/null || printf '000')
  printf '%-32s %s\n' "$ruta" "$codigo"
  if [[ "$codigo" != "200" ]]; then fallos=1; fi
done

ruta=/ruta-que-no-existe
codigo=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base_url}${ruta}" 2>/dev/null || printf '000')
printf '%-32s %s (esperado 404)\n' "$ruta" "$codigo"
if [[ "$codigo" != "404" ]]; then fallos=1; fi

exit "$fallos"
