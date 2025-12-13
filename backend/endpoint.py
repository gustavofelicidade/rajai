from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/dados", tags=["dados"])

# Cache interno que recebe os dados carregados em main.py
# Esperado: {"tabela_1": [ {col: val, ...}, ... ], ...}
DATA_CACHE: Dict[str, List[Dict[str, Any]]] = {}


def set_data_cache(cache: Dict[str, List[Dict[str, Any]]]) -> None:
    DATA_CACHE.clear()
    DATA_CACHE.update(cache)


# -----------------------------
# Mapeamento semântico (mais legível)
# -----------------------------
# CNAEs e nomes conforme Tabela 1 do PDF. :contentReference[oaicite:4]{index=4}
# Perfil (misto/ultra/variável) baseado na classificação descrita no PDF. :contentReference[oaicite:5]{index=5}
DATASETS: Dict[str, Dict[str, str]] = {
    "hipermercados": {
        "cache_key": "tabela_1",
        "cnae": "47.11-3/01",
        "label": "Hipermercados",
        "perfil": "misto",
    },
    "supermercados": {
        "cache_key": "tabela_2",
        "cnae": "47.11-3/02",
        "label": "Supermercados",
        "perfil": "variavel_por_uf",
    },
    "minimercados-mercearias-armazens": {
        "cache_key": "tabela_3",
        "cnae": "47.12-1/00",
        "label": "Minimercados, Mercearias e Armazéns",
        "perfil": "variavel_por_uf",
    },
    "padarias-confeitarias": {
        "cache_key": "tabela_4",
        "cnae": "47.21-1/02",
        "label": "Padarias e Confeitarias",
        "perfil": "misto",
    },
    "laticinios-frios": {
        "cache_key": "tabela_5",
        "cnae": "47.21-1/03",
        "label": "Varejistas de Laticínios e Frios",
        "perfil": "misto",
    },
    "doces-balas-bombons": {
        "cache_key": "tabela_6",
        "cnae": "47.21-1/04",
        "label": "Varejistas de Doces, Balas, Bombons e Semelhantes",
        "perfil": "ultraprocessados",
    },
}


def _get_table_by_cache_key(cache_key: str) -> List[Dict[str, Any]]:
    data = DATA_CACHE.get(cache_key)
    if data is None:
        raise HTTPException(status_code=404, detail="Tabela não encontrada no cache")
    return data


def _get_dataset(slug: str) -> Dict[str, str]:
    ds = DATASETS.get(slug)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset não encontrado")
    return ds


# -----------------------------
# Helpers: filtro/search/paginação
# -----------------------------
_NUM_RE = re.compile(r"^-?\d+(?:[.,]\d+)?$")


def _try_parse_number(value: Any) -> Optional[float]:
    """
    Tenta converter strings numéricas comuns pt-BR:
    - "1.234" / "1,234" / "1234" / "12,34"
    Retorna float ou None.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None

    s = value.strip()
    if not s:
        return None

    # remove separador de milhar (.)
    # e troca decimal (, -> .) quando aplicável
    # Ex.: "10.205" (milhar) vira "10205"
    # Ex.: "39,6" vira "39.6"
    if _NUM_RE.match(s):
        s2 = s.replace(".", "").replace(",", ".")
        try:
            return float(s2)
        except ValueError:
            return None
    return None


def _row_matches_search(row: Dict[str, Any], q: str) -> bool:
    q_low = q.lower().strip()
    if not q_low:
        return True
    for v in row.values():
        if v is None:
            continue
        if q_low in str(v).lower():
            return True
    return False


def _apply_filters(
    rows: List[Dict[str, Any]],
    q: Optional[str],
    offset: int,
    limit: int,
) -> Tuple[List[Dict[str, Any]], int]:
    total = len(rows)

    if q:
        rows = [r for r in rows if _row_matches_search(r, q)]
        total = len(rows)

    if offset < 0:
        offset = 0
    if limit < 0:
        limit = 0

    if offset:
        rows = rows[offset:]

    if limit:
        rows = rows[:limit]

    return rows, total


def _summarize_numeric(rows: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Soma colunas numéricas sempre que conseguir.
    Útil pra CSVs tipo: Ativos/Inativos/Total, etc.
    """
    acc: Dict[str, float] = {}
    for r in rows:
        for k, v in r.items():
            num = _try_parse_number(v)
            if num is None:
                continue
            acc[k] = acc.get(k, 0.0) + num
    return acc


# -----------------------------
# Endpoints novos (semânticos)
# -----------------------------
@router.get("/catalogo")
async def get_catalogo():
    """
    Lista os datasets disponíveis de forma entendível (slug + CNAE + label + perfil).
    """
    return {
        "items": [
            {
                "slug": slug,
                "cnae": ds["cnae"],
                "label": ds["label"],
                "perfil": ds["perfil"],
                "endpoint": f"/api/v1/dados/{slug}",
            }
            for slug, ds in DATASETS.items()
        ]
    }


@router.get("/{slug}")
async def get_dataset_data(
    slug: str,
    q: Optional[str] = Query(default=None, description="Busca textual em qualquer coluna"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=0, ge=0, description="0 = sem limite"),
):
    """
    Retorna os dados do CSV associado ao 'slug', com paginação e busca.
    """
    ds = _get_dataset(slug)
    raw = _get_table_by_cache_key(ds["cache_key"])

    # aplica filtros
    page, total = _apply_filters(raw, q=q, offset=offset, limit=limit)

    return {
        "meta": {
            "slug": slug,
            "cnae": ds["cnae"],
            "label": ds["label"],
            "perfil": ds["perfil"],
            "total_rows": total,
            "returned_rows": len(page),
            "offset": offset,
            "limit": limit,
        },
        "data": page,
    }


@router.get("/{slug}/resumo")
async def get_dataset_summary(slug: str):
    """
    Retorna um resumo numérico (somas) das colunas numéricas encontradas.
    """
    ds = _get_dataset(slug)
    raw = _get_table_by_cache_key(ds["cache_key"])
    resumo = _summarize_numeric(raw)

    return {
        "meta": {"slug": slug, "cnae": ds["cnae"], "label": ds["label"], "perfil": ds["perfil"]},
        "sum": resumo,
    }


# -----------------------------
# Compatibilidade retroativa (opcional)
# -----------------------------
@router.get("/tabela_1")
async def get_tabela_1():
    return _get_table_by_cache_key("tabela_1")


@router.get("/tabela_2")
async def get_tabela_2():
    return _get_table_by_cache_key("tabela_2")


@router.get("/tabela_3")
async def get_tabela_3():
    return _get_table_by_cache_key("tabela_3")


@router.get("/tabela_4")
async def get_tabela_4():
    return _get_table_by_cache_key("tabela_4")


@router.get("/tabela_5")
async def get_tabela_5():
    return _get_table_by_cache_key("tabela_5")


@router.get("/tabela_6")
async def get_tabela_6():
    return _get_table_by_cache_key("tabela_6")
