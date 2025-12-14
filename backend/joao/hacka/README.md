# Feiras Urbanas — Rio de Janeiro (Mapa Interativo)

Este projeto transforma uma lista de feiras em um **mapa interativo** com:
- filtros por RA e dia
- busca por bairro/endereço
- clusterização de pontos
- heatmap de densidade
- mapa-base online (OpenStreetMap) e offline (PMTiles)

## Pré-requisitos

### Para rodar o mapa
- Python 3 (recomendado 3.11/3.12)
- Internet (se você não tiver PMTiles, o mapa-base vem do OpenStreetMap)

### Para gerar PMTiles offline (opcional)
- Docker Desktop instalado e rodando
- Espaço em disco (PMTiles pode ficar grande)

## Arquivos principais

- `feiras_rio.csv`: dados crus (endereço/bairro/dia/RA)
- `feiras_rio_geocoded.csv`: com `lat/lon` (geocoding)
- `feiras_rio_geocoded_fixed.csv`: versão final corrigida (ex: overrides por ID)
- `map/feiras_rio.geojson`: dados do mapa (gerado pelo script)
- `map/index.html`: visualização (Leaflet)
- `map/tiles/rio.pmtiles`: mapa-base offline (opcional)

## Rodar (um comando)

Na raiz do projeto:

```bash
./run.sh 8000