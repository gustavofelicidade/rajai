#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8000}"

CSV_FIXED="feiras_rio_geocoded_fixed.csv"
CSV_GEO="feiras_rio_geocoded.csv"
CSV_RAW="feiras_rio.csv"

GEOJSON_OUT="map/feiras_rio.geojson"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> (1) Preparando ambiente Python (.venv)"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

pip -q install --upgrade pip >/dev/null
pip -q install pandas geopy >/dev/null

echo "==> (2) Gerando GeoJSON"
if [ -f "$CSV_FIXED" ]; then
  IN="$CSV_FIXED"
elif [ -f "$CSV_GEO" ]; then
  IN="$CSV_GEO"
elif [ -f "$CSV_RAW" ]; then
  echo "   - CSV cru encontrado. Geocodificando..."
  python scripts/geocode_feiras.py --input "$CSV_RAW" --output "$CSV_GEO"
  IN="$CSV_GEO"
else
  echo "ERRO: Nenhum CSV encontrado."
  exit 1
fi

mkdir -p map
python scripts/build_geojson.py --input "$IN" --output "$GEOJSON_OUT"

URL="http://localhost:${PORT}"

echo "==> (3) Subindo servidor local em map/ na porta ${PORT}"
cd map

# ---- abrir navegador automaticamente ----
open_browser () {
  if command -v open >/dev/null 2>&1; then
    # macOS
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "$URL"
  elif command -v wslview >/dev/null 2>&1; then
    # WSL
    wslview "$URL"
  else
    echo "Abra manualmente: $URL"
  fi
}

# abre o navegador em background após 1s (tempo do server subir)
( sleep 1 && open_browser ) &

python -m http.server "$PORT"