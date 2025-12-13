from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/dados", tags=["dados"])

# Cache interno que recebe os dados carregados em main.py
DATA_CACHE: Dict[str, List[Dict[str, str]]] = {}


def set_data_cache(cache: Dict[str, List[Dict[str, str]]]) -> None:
  DATA_CACHE.clear()
  DATA_CACHE.update(cache)


def _get_table(name: str) -> List[Dict[str, str]]:
  data = DATA_CACHE.get(name)
  if data is None:
    raise HTTPException(status_code=404, detail="Tabela não encontrada")
  return data


@router.get("/tabela_1")
async def get_tabela_1():
  return _get_table("tabela_1")


@router.get("/tabela_2")
async def get_tabela_2():
  return _get_table("tabela_2")


@router.get("/tabela_3")
async def get_tabela_3():
  return _get_table("tabela_3")


@router.get("/tabela_4")
async def get_tabela_4():
  return _get_table("tabela_4")


@router.get("/tabela_5")
async def get_tabela_5():
  return _get_table("tabela_5")


@router.get("/tabela_6")
async def get_tabela_6():
  return _get_table("tabela_6")
