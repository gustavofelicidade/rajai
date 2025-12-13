# config.py
import os

# Definições de Diretórios
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RAW_DIR = os.path.join(DATA_DIR, 'raw')
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')

# Configurações do Sentinel-2
SENTINEL_BANDS = ['B02', 'B03', 'B04', 'B08'] # R, G, B, NIR (Infravermelho próximo é ótimo para vegetação)
IMAGE_SIZE = 64  # Tamanho do recorte (chip) da imagem em pixels (64x64 é leve)
RESOLUTION = 10  # Resolução do Sentinel (10m por pixel)

# Mapeamento de Classes (Metodologia CNAE filtrada para o RIO DE JANEIRO/SUDESTE)
# Baseado na metodologia fornecida:
# Região Sudeste (SE) e especificidades do RJ.

CLASSES_MAP = {
    0: "Sem Dados / Outros",
    1: "In Natura",
    2: "Ultraprocessados",
    3: "Mistos"
}

# Dicionário reverso para facilitar a classificação
# Aqui listamos os tipos de estabelecimentos que caem em cada categoria no RJ
CNAE_CATEGORIES = {
    "In Natura": [
        "Peixarias",
        "Hortifrutigranjeiros",
        "Açougue"
        # Supermercados e Minimercados no RJ são MISTOS segundo a regra do texto (SE)
    ],
    "Ultraprocessados": [
        "Lanchonetes",
        "Lojas de conveniência",
        "Varejistas de doces",
        "Bares",             # Bares no Sudeste são ultraprocessados
        "Cantinas",          # Cantinas no RJ são ultraprocessados
        "Serviços ambulantes de alimentação" # Ambulantes no RJ são ultraprocessados
    ],
    "Mistos": [
        "Hipermercados",
        "Restaurantes",
        "Padarias",
        "Varejistas de laticínios",
        "Varejistas de produtos alimentícios em geral",
        "Fornecimento de alimentos preparados",
        "Supermercados",     # No Sudeste (RJ), Supermercado é Misto
        "Mercearias"         # No Sudeste (RJ), Mercearia é Misto
    ]
}

# Cores para plotagem (R, G, B)
CLASS_COLORS = {
    "In Natura": (0, 255, 0),       # Verde
    "Ultraprocessados": (255, 0, 0), # Vermelho
    "Mistos": (255, 165, 0)         # Laranja
}