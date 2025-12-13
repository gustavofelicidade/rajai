from __future__ import annotations

import csv
import sys
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).parent
if str(BASE_DIR) not in sys.path:
  sys.path.append(str(BASE_DIR))

from endpoint import (
  data_router,
  geo_router,
  set_data_cache,
  set_geo_cache,
)

# Caminhos de dados
DATA_DIR = BASE_DIR / "dados" / "tabelas_csv"
TABLE_FILES = {f"tabela_{i}": DATA_DIR / f"tabela_{i}.csv" for i in range(1, 7)}
GEO_FILE = BASE_DIR / "dados" / "dados.csv"

# Cache carregado na inicialização
DATA_CACHE: Dict[str, List[Dict[str, str]]] = {}
GEO_CACHE: List[Dict[str, str]] = []


def read_csv_to_dicts(path: Path) -> List[Dict[str, str]]:
  """Lê um CSV em memória como lista de dicionários."""
  with path.open(newline="", encoding="utf-8") as fp:
    return [row for row in csv.DictReader(fp)]


def load_all_tables() -> Dict[str, List[Dict[str, str]]]:
  loaded: Dict[str, List[Dict[str, str]]] = {}
  for name, path in TABLE_FILES.items():
    if not path.exists():
      raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    loaded[name] = read_csv_to_dicts(path)
  return loaded


def load_geo_table() -> List[Dict[str, str]]:
  if not GEO_FILE.exists():
    raise FileNotFoundError(f"Arquivo não encontrado: {GEO_FILE}")
  return read_csv_to_dicts(GEO_FILE)


# Inicialização do app
app = FastAPI(title="RAJAI API", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Carrega CSVs ao subir o serviço
DATA_CACHE = load_all_tables()
GEO_CACHE = load_geo_table()
set_data_cache(DATA_CACHE)
set_geo_cache(GEO_CACHE)

# Rotas de dados
app.include_router(data_router)
app.include_router(geo_router)


@app.get("/")
async def root():
  return {"status": "API RAJAI is running"}


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
