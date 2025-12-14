#!/usr/bin/env bash
set -euo pipefail

# Saídas
OUT_DIR="map/tiles"
OUT_FILE="${OUT_DIR}/rio.pmtiles"

# Fonte OSM (Geofabrik) - RJ
PBF_URL="https://download.geofabrik.de/south-america/brazil/rio-de-janeiro-latest.osm.pbf"
PBF_FILE="data/rio-de-janeiro-latest.osm.pbf"

mkdir -p data
mkdir -p "${OUT_DIR}"

echo "==> (1) Baixando OSM PBF do RJ (Geofabrik)"
if [ ! -f "${PBF_FILE}" ]; then
  curl -L "${PBF_URL}" -o "${PBF_FILE}"
else
  echo "   - Já existe: ${PBF_FILE}"
fi

echo "==> (2) Gerando PMTiles com Planetiler (Docker)"
echo "   - Saída: ${OUT_FILE}"

# Planetiler gera tiles vetoriais.
# Importante: vamos pedir saída PMTiles e limitar zoom para não ficar gigantesco.
# Você pode ajustar --maxzoom se quiser mais detalhe (fica mais pesado).
docker run --rm \
  -v "$(pwd)/data":/data \
  -v "$(pwd)/${OUT_DIR}":/out \
  ghcr.io/onthegomap/planetiler:latest \
  --download=false \
  --input /data/$(basename "${PBF_FILE}") \
  --output /out/rio.pmtiles \
  --maxzoom=14

echo "==> OK! PMTiles criado em: ${OUT_FILE}"
echo "Dica: se quiser mais detalhe, aumente --maxzoom (ex: 15/16), mas o arquivo cresce bastante."