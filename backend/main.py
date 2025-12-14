from __future__ import annotations

import csv
import sys
import unicodedata
from pathlib import Path
from typing import Dict, List, Any

import pandas as pd # Usaremos pandas para fazer o cálculo rápido em memória
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Certifique-se de que DATASETS está definido corretamente no seu endpoint.py
# com chaves como 'ultraprocessado', 'in_natura', 'misto' para bater com as colunas que você quer.
from endpoint import (
    data_router,
    geo_router,
    set_data_cache,
    set_geo_cache,
    DATASETS, 
)

# --- Configuração de Caminhos ---
DATA_FILE = BASE_DIR / "dados" / "dados.csv"
CENSO_FILE = BASE_DIR / "dados" / "Censo_2022.csv"

# Cache Global
DENSITY_CACHE: List[Dict[str, Any]] = []

# --- Funções Auxiliares ---

def normalizar_nome_bairro(nome):
    """Normaliza o nome para garantir o cruzamento (Ex: 'Botafogo ' -> 'BOTAFOGO')"""
    if not isinstance(nome, str): return ""
    nfkd = unicodedata.normalize('NFKD', nome)
    palavra_sem_acento = u"".join([c for c in nfkd if not unicodedata.combining(c)])
    return palavra_sem_acento.upper().strip()

def processar_densidade_em_memoria():
    """
    Lê dados.csv e Censo_2022.csv, classifica os tipos (Ultra, In Natura, etc.),
    calcula densidades e OS PERCENTIS para cada tipo.
    """
    if not DATA_FILE.exists() or not CENSO_FILE.exists():
        print("⚠️ Arquivos dados.csv ou Censo_2022.csv não encontrados.")
        return []

    print("⚙️ Processando densidade, tipos e percentis em memória...")
    
    try:
        # 1. Carrega CSVs
        # Dtype str para garantir que o CNAE não perca zeros ou formatação
        df_dados = pd.read_csv(DATA_FILE, dtype={'classificacao_cnae': str})
        df_censo = pd.read_csv(CENSO_FILE)
        
        # 2. Prepara Censo
        df_censo['bairro_norm'] = df_censo['nome'].apply(normalizar_nome_bairro)
        
        if 'Shape_Area' in df_censo.columns:
            df_censo['area_km2'] = df_censo['Shape_Area'] / 1_000_000
        else:
            df_censo['area_km2'] = 1 
            
        df_censo_resumo = df_censo[['bairro_norm', 'area_km2', 'Total_de_pessoas_2022', 'nome']].copy()
        df_censo_resumo.rename(columns={'nome': 'bairro_real'}, inplace=True)

        # 3. Classificação e Contagem por Tipo (Ultra, In Natura, Misto...)
        df_dados['bairro_norm'] = df_dados['bairro'].apply(normalizar_nome_bairro)
        
        # Cria mapa de CNAE -> Tipo baseado no DATASETS importado
        # Ex: '4712-1/00' -> 'ultraprocessado'
        cnae_to_type = {}
        for tipo_slug, info in DATASETS.items():
            if 'cnae' in info:
                c_clean = str(info['cnae']).strip()
                cnae_to_type[c_clean] = tipo_slug

        # Aplica o mapeamento
        df_dados['classificacao_cnae'] = df_dados['classificacao_cnae'].str.strip()
        df_dados['tipo_estabelecimento'] = df_dados['classificacao_cnae'].map(cnae_to_type).fillna('outros')

        # Pivot Table: Transforma linhas em colunas (total_ultraprocessado, total_in_natura, etc.)
        df_pivot = df_dados.pivot_table(
            index='bairro_norm',
            columns='tipo_estabelecimento',
            aggfunc='size',
            fill_value=0
        )
        
        # Renomeia as colunas para ficar padronizado (Ex: total_ultraprocessado)
        df_pivot.columns = [f"total_{col}" for col in df_pivot.columns]
        df_pivot.reset_index(inplace=True)

        # Calcula o TOTAL GERAL (soma de todas as colunas numéricas geradas)
        cols_numericas = [c for c in df_pivot.columns if c != 'bairro_norm']
        df_pivot['total'] = df_pivot[cols_numericas].sum(axis=1)

        # 4. Cruzamento (Merge) com Censo
        df_final = pd.merge(df_pivot, df_censo_resumo, on='bairro_norm', how='left')
        
        # Remove bairros sem população ou inválidos
        df_final = df_final[df_final['Total_de_pessoas_2022'] > 0].copy()
        
        # 5. Cálculos de Métricas Dinâmicas (Densidade e PERCENTIL)
        # Identifica todas as colunas de contagem (total_...)
        colunas_totais = [c for c in df_final.columns if c.startswith('total') or c == 'total']

        for col_total in colunas_totais:
            # Extrai o nome do sufixo (ex: 'ultraprocessado' de 'total_ultraprocessado')
            sufixo = col_total.replace('total_', '') if col_total != 'total' else 'total'
            if sufixo == 'total': 
                nome_base = 'total' # caso especial para a coluna 'total'
            else:
                nome_base = sufixo

            # A. Densidade por 10k
            nome_densidade = f"densidade_{nome_base}_10k"
            df_final[nome_densidade] = (
                df_final[col_total] / df_final['Total_de_pessoas_2022']
            ) * 10000
            df_final[nome_densidade] = df_final[nome_densidade].round(2)

            # B. Percentil (Ranking relativo de 0 a 100)
            # AQUI ESTÁ A CORREÇÃO SOLICITADA
            nome_percentil = f"percentil_densidade_{nome_base}"
            df_final[nome_percentil] = df_final[nome_densidade].rank(pct=True) * 100
            df_final[nome_percentil] = df_final[nome_percentil].round(2)

        # 6. Retorna como lista de dicts
        return df_final.where(pd.notnull(df_final), None).to_dict(orient='records')
        
    except Exception as e:
        print(f"❌ Erro ao calcular densidade: {e}")
        # Imprime o erro completo para debug se necessário
        import traceback
        traceback.print_exc()
        return []

def read_csv_to_dicts(path: Path) -> List[Dict[str, Any]]:
    """Lê CSV simples para os dados brutos (pins)"""
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as fp:
        return [row for row in csv.DictReader(fp)]

def load_and_distribute_data():
    global DENSITY_CACHE
    
    print(f"🔄 Carregando dados do sistema...")

    # 1. Carrega Dados Brutos (Pins)
    try:
        all_rows = read_csv_to_dicts(DATA_FILE)
        set_geo_cache(all_rows)
        
        data_cache_built = {}
        # Assegura que DATASETS está sendo usado para filtrar pins também
        for slug, info in DATASETS.items():
            cache_key = info.get("cache_key", slug) # Fallback para slug se cache_key não existir
            target_cnae = info.get("cnae", "")
            subset = [row for row in all_rows if row.get("classificacao_cnae", "").strip() == target_cnae]
            data_cache_built[cache_key] = subset
        
        set_data_cache(data_cache_built)
        print(f"✅ Dados Brutos (Pins) carregados: {len(all_rows)}")
        
    except Exception as e:
        print(f"❌ Erro ao ler dados.csv: {e}")

    # 2. Processa Densidade em Memória (Mapa de Calor)
    DENSITY_CACHE = processar_densidade_em_memoria()
    if DENSITY_CACHE:
        # Exibe um preview das chaves geradas para debug
        keys_exemplo = list(DENSITY_CACHE[0].keys())
        print(f"✅ Métricas Calculadas. Colunas disponíveis: {keys_exemplo}")
        print(f"✅ Total de bairros processados: {len(DENSITY_CACHE)}")
    else:
        print("⚠️ Falha ao calcular densidade.")


# --- Inicialização do App ---
app = FastAPI(title="RAJAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    load_and_distribute_data()

app.include_router(data_router)
app.include_router(geo_router)

@app.get("/api/v1/geo/densidade")
async def get_densidade_bairros():
    """Retorna os dados processados em memória (com quartis e percentis)"""
    return DENSITY_CACHE

@app.get("/")
async def root():
    return {"status": "API RAJAI running", "source": "In-Memory Processing"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)