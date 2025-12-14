from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query

data_router = APIRouter(prefix="/api/v1/dados", tags=["dados"])
geo_router = APIRouter(prefix="/api/v1/geo/bairros", tags=["geo"])

# Cache interno que recebe os dados carregados em main.py
# Esperado: {"tabela_1": [ {col: val, ...}, ... ], ...}
DATA_CACHE: Dict[str, List[Dict[str, Any]]] = {}
GEO_ROWS: List[Dict[str, Any]] = []
GEO_INDEX: Dict[str, List[Dict[str, Any]]] = {}
GEO_SUMMARY: Dict[str, Dict[str, Any]] = {}
GEO_CATALOG: Dict[str, List[str]] = {}

# Métricas suportadas no mapa
GEO_METRICS = [
    "total",
    "total_in_natura",
    "total_misto",
    "total_ultraprocessado",
    "ratio_ultra_sobre_total",
    "densidade_total_10k",
    "densidade_in_natura_10k",
    "densidade_misto_10k",
    "densidade_ultraprocessado_10k",
    "percentil_densidade_total",
    "percentil_densidade_in_natura",
    "percentil_densidade_misto",
    "percentil_densidade_ultraprocessado",
]

# Normalização de bairros para casar CSV x GeoJSON
_SPACE_RE = re.compile(r"\s+")
_PUNCT_RE = re.compile(r"[^\w\s/-]", re.UNICODE)
ALIASES = {
    # Ajustes rápidos conhecidos entre CSV e GeoJSON
    "VL ISABEL": "VILA ISABEL",
    "ZONA PORTUARIA": "ZONA PORTUARIA",
}


def normalize_bairro(name: str) -> str:
    if not name:
        return ""
    s = name.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = _PUNCT_RE.sub("", s)
    s = _SPACE_RE.sub(" ", s).strip()
    return ALIASES.get(s, s)


def set_data_cache(cache: Dict[str, List[Dict[str, Any]]]) -> None:
    DATA_CACHE.clear()
    DATA_CACHE.update(cache)


def set_geo_cache(rows: List[Dict[str, Any]]) -> None:
    """
    Recebe linhas de dados.csv (bairro, classificacao_grupo, classificacao_cnae, quantidade).
    Cria cache, índice por bairro normalizado e sumários para choropleth/tooltip.
    """
    GEO_ROWS.clear()
    GEO_INDEX.clear()
    GEO_SUMMARY.clear()

    groups_set = set()
    cnaes_set = set()
    pop_map: Dict[str, int] = {}

    for row in rows:
        bairro_raw = str(row.get("bairro", "")).strip()
        bairro_norm = normalize_bairro(bairro_raw)
        grupo = str(row.get("classificacao_grupo", "")).strip()
        cnae = str(row.get("classificacao_cnae", "")).strip()
        q = _try_parse_number(row.get("quantidade"))
        quantidade = int(q) if q is not None else 0

        cleaned = {
            "bairro_raw": bairro_raw,
            "bairro": bairro_norm,
            "classificacao_grupo": grupo,
            "classificacao_cnae": cnae,
            "quantidade": quantidade,
        }
        GEO_ROWS.append(cleaned)
        GEO_INDEX.setdefault(bairro_norm, []).append(cleaned)

        # populações são redundantes no CSV; guarda a primeira encontrada
        pop_val = _try_parse_number(row.get("Total_de_pessoas_2022"))
        if pop_val:
            pop_map.setdefault(bairro_norm, int(pop_val))

        if grupo:
            groups_set.add(grupo)
        if cnae:
            cnaes_set.add(cnae)

    # Monta sumários por bairro
    for bairro, items in GEO_INDEX.items():
        group_totals: Dict[str, int] = {}
        breakdown: Dict[str, List[Dict[str, Any]]] = {}

        for item in items:
            g = item["classificacao_grupo"] or "Sem grupo"
            qty = item["quantidade"]
            group_totals[g] = group_totals.get(g, 0) + qty
            breakdown.setdefault(g, []).append(
                {"classificacao_cnae": item["classificacao_cnae"], "quantidade": qty}
            )

        total = sum(group_totals.values())
        total_in_natura = group_totals.get("In natura", 0)
        total_misto = group_totals.get("Misto", 0)
        total_ultra = group_totals.get("Ultraprocessado", 0)
        ratio_ultra = (total_ultra / total) if total else 0
        pop_total = pop_map.get(bairro)
        dens_total = (total * 10000 / pop_total) if pop_total else 0
        dens_in_natura = (total_in_natura * 10000 / pop_total) if pop_total else 0
        dens_misto = (total_misto * 10000 / pop_total) if pop_total else 0
        dens_ultra = (total_ultra * 10000 / pop_total) if pop_total else 0

        GEO_SUMMARY[bairro] = {
            "bairro": bairro,
            "populacao_2022": pop_total or 0,
            "totais": {
                "total": total,
                "total_in_natura": total_in_natura,
                "total_misto": total_misto,
                "total_ultraprocessado": total_ultra,
                "ratio_ultra_sobre_total": ratio_ultra,
                "densidade_total_10k": dens_total,
                "densidade_in_natura_10k": dens_in_natura,
                "densidade_misto_10k": dens_misto,
                "densidade_ultraprocessado_10k": dens_ultra,
            },
            "breakdown": breakdown,
        }
        metrics_to_rank = [
        ("densidade_total_10k", "percentil_densidade_total"),
        ("densidade_in_natura_10k", "percentil_densidade_in_natura"),
        ("densidade_misto_10k", "percentil_densidade_misto"),
        ("densidade_ultraprocessado_10k", "percentil_densidade_ultraprocessado"),
    ]

    all_bairros = list(GEO_SUMMARY.values())
    total_bairros = len(all_bairros)

    if total_bairros > 0:
        for metric_source, metric_target in metrics_to_rank:
            # Ordena por densidade
            all_bairros.sort(key=lambda x: x["totais"].get(metric_source, 0))
            # Aplica o rank
            for i, item in enumerate(all_bairros):
                percentil = ((i + 1) / total_bairros) * 100
                item["totais"][metric_target] = round(percentil, 2)
                
    GEO_CATALOG.clear()
    GEO_CATALOG.update(
        {
            "groups": sorted(groups_set),
            "cnaes": sorted(cnaes_set),
            "metrics": GEO_METRICS,
        }
    )


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
        "perfil_alimentar": "misto",
    },
    "supermercados": {
        "cache_key": "tabela_2",
        "cnae": "47.11-3/02",
        "label": "Supermercados",
        "perfil_alimentar": "variavel_por_uf",
    },
    "minimercados-mercearias-armazens": {
        "cache_key": "tabela_3",
        "cnae": "47.12-1/00",
        "label": "Minimercados, Mercearias e Armazéns",
        "perfil_alimentar": "variavel_por_uf",
    },
    "padarias-confeitarias": {
        "cache_key": "tabela_4",
        "cnae": "47.21-1/02",
        "label": "Padarias e Confeitarias",
        "perfil_alimentar": "misto",
    },
    "laticinios-frios": {
        "cache_key": "tabela_5",
        "cnae": "47.21-1/03",
        "label": "Varejistas de Laticínios e Frios",
        "perfil_alimentar": "misto",
    },
    "doces-balas-bombons": {
        "cache_key": "tabela_6",
        "cnae": "47.21-1/04",
        "label": "Varejistas de Doces, Balas, Bombons e Semelhantes",
        "perfil_alimentar": "ultraprocessados",
    },
    # TODO: preparar camada de distribuidores informais (sem CNPJ) futuramente.
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
# Helpers GEO (choropleth + tooltip)
# -----------------------------
def _validate_metric(metric: str) -> str:
    if metric not in GEO_METRICS:
        raise HTTPException(status_code=400, detail=f"Métrica inválida: {metric}")
    return metric


def _filter_geo_rows(
    bairro: Optional[str] = None, grupo: Optional[str] = None, cnae: Optional[str] = None, q: Optional[str] = None
) -> List[Dict[str, Any]]:
    results = GEO_ROWS

    if bairro:
        bairro_norm = normalize_bairro(bairro)
        results = [r for r in results if r["bairro"] == bairro_norm]

    if grupo:
        g_low = grupo.lower().strip()
        results = [r for r in results if r["classificacao_grupo"].lower() == g_low]

    if cnae:
        c_low = cnae.lower().strip()
        results = [r for r in results if r["classificacao_cnae"].lower() == c_low]

    if q:
        results = [r for r in results if _row_matches_search(r, q)]

    return results


# -----------------------------
# Endpoints GEO (choropleth + tooltip + linhas)
# -----------------------------
@geo_router.get("/catalogo")
async def geo_catalogo():
    if not GEO_CATALOG:
        raise HTTPException(status_code=404, detail="Catálogo de bairros não carregado")
    return GEO_CATALOG


@geo_router.get("/resumo")
async def geo_resumo_geral():
    """Resumo agregado de todos os bairros.

    Útil para cards/indicadores no frontend (ex.: percentuais por grupo).
    """
    if not GEO_SUMMARY:
        raise HTTPException(status_code=404, detail="Resumo de bairros não carregado")

    total = 0
    total_in_natura = 0
    total_misto = 0
    total_ultra = 0

    # soma os totais já computados por bairro
    for summary in GEO_SUMMARY.values():
        t = summary.get("totais", {})
        total += int(t.get("total", 0) or 0)
        total_in_natura += int(t.get("total_in_natura", 0) or 0)
        total_misto += int(t.get("total_misto", 0) or 0)
        total_ultra += int(t.get("total_ultraprocessado", 0) or 0)

    def pct(x: int, denom: int) -> float:
        return (x / denom * 100) if denom else 0.0

    return {
        "meta": {"geo_level": "bairro"},
        "totais": {
            "total": total,
            "total_in_natura": total_in_natura,
            "total_misto": total_misto,
            "total_ultraprocessado": total_ultra,
        },
        "percentuais": {
            "in_natura": pct(total_in_natura, total),
            "misto": pct(total_misto, total),
            "ultraprocessado": pct(total_ultra, total),
        },
    }


@geo_router.get("/choropleth")
async def geo_choropleth(
    metric: str = Query(default="total_ultraprocessado", description="Métrica para pintar o mapa"),
):
    metric = _validate_metric(metric)
    data = [
        {
            "bairro": summary["bairro"],
            "value": summary["totais"].get(metric, 0),
        }
        for summary in GEO_SUMMARY.values()
    ]
    return {"meta": {"geo_level": "bairro", "geo_join_key": "bairro", "metric": metric}, "data": data}


@geo_router.get("/linhas")
async def geo_linhas(
    bairro: Optional[str] = Query(default=None, description="Filtro por bairro"),
    grupo: Optional[str] = Query(default=None, description="Filtro por classificação de grupo"),
    cnae: Optional[str] = Query(default=None, description="Filtro por classificação CNAE"),
    q: Optional[str] = Query(default=None, description="Busca textual"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=0, ge=0, description="0 = sem limite"),
):
    rows = _filter_geo_rows(bairro=bairro, grupo=grupo, cnae=cnae, q=q)
    total = len(rows)
    if offset:
        rows = rows[offset:]
    if limit:
        rows = rows[:limit]
    return {
        "meta": {
            "total_rows": total,
            "returned_rows": len(rows),
            "offset": offset,
            "limit": limit,
            "filters": {"bairro": bairro, "grupo": grupo, "cnae": cnae, "q": q},
        },
        "data": rows,
    }


@geo_router.get("/{bairro}/tooltip")
async def geo_tooltip(bairro: str):
    key = normalize_bairro(bairro)
    summary = GEO_SUMMARY.get(key)
    if not summary:
        raise HTTPException(status_code=404, detail="Bairro não encontrado")
    return {
        "meta": {"bairro": key, "populacao_2022": summary.get("populacao_2022", 0)},
        "totais": summary["totais"],
        "breakdown": summary["breakdown"],
    }


# -----------------------------
# Endpoints novos (semânticos)
# -----------------------------
@data_router.get("/catalogo")
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
                "perfil_alimentar": ds["perfil_alimentar"],
                "endpoint": f"/api/v1/dados/{slug}",
            }
            for slug, ds in DATASETS.items()
        ]
    }


@data_router.get("/{slug}")
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
            "perfil_alimentar": ds["perfil_alimentar"],
            "total_rows": total,
            "returned_rows": len(page),
            "offset": offset,
            "limit": limit,
        },
        "data": page,
    }


@data_router.get("/{slug}/resumo")
async def get_dataset_summary(slug: str):
    """
    Retorna um resumo numérico (somas) das colunas numéricas encontradas.
    """
    ds = _get_dataset(slug)
    raw = _get_table_by_cache_key(ds["cache_key"])
    resumo = _summarize_numeric(raw)

    return {
        "meta": {
            "slug": slug,
            "cnae": ds["cnae"],
            "label": ds["label"],
            "perfil_alimentar": ds["perfil_alimentar"],
        },
        "sum": resumo,
    }


# -----------------------------
# Compatibilidade retroativa (opcional)
# -----------------------------
@data_router.get("/tabela_1")
async def get_tabela_1():
    return _get_table_by_cache_key("tabela_1")


@data_router.get("/tabela_2")
async def get_tabela_2():
    return _get_table_by_cache_key("tabela_2")


@data_router.get("/tabela_3")
async def get_tabela_3():
    return _get_table_by_cache_key("tabela_3")


@data_router.get("/tabela_4")
async def get_tabela_4():
    return _get_table_by_cache_key("tabela_4")


@data_router.get("/tabela_5")
async def get_tabela_5():
    return _get_table_by_cache_key("tabela_5")


@data_router.get("/tabela_6")
async def get_tabela_6():
    return _get_table_by_cache_key("tabela_6")
