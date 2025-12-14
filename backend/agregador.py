import pandas as pd
import os
import unicodedata

# --- Configuração de Caminhos ---
CAMINHO_DADOS = 'dados/dados.csv'
CAMINHO_CENSO = 'dados/Censo_2022.csv'
CAMINHO_SAIDA = 'dados/dados_consolidados_densidade.csv'

# --- Função de Normalização ---
def normalizar_nome(nome):
    if not isinstance(nome, str): return ""
    nfkd = unicodedata.normalize('NFKD', nome)
    palavra_sem_acento = u"".join([c for c in nfkd if not unicodedata.combining(c)])
    return palavra_sem_acento.upper().strip()

# 1. Verifica arquivos
if not os.path.exists(CAMINHO_DADOS) or not os.path.exists(CAMINHO_CENSO):
    print("❌ Erro: Arquivos não encontrados.")
    exit()

print("🔄 Lendo arquivos...")
df_dados = pd.read_csv(CAMINHO_DADOS)
df_censo = pd.read_csv(CAMINHO_CENSO)

# 2. Prepara o Censo (Área e População)
print("📐 Calculando áreas e normalizando...")
df_censo['bairro_norm'] = df_censo['nome'].apply(normalizar_nome)
df_censo['area_km2'] = df_censo['Shape_Area'] / 1_000_000
df_censo_resumo = df_censo[['bairro_norm', 'area_km2', 'Total_de_pessoas_2022']]

# 3. Agrega os Dados das Lojas
print("⚙️  Processando estabelecimentos...")
# Importante: Mantemos a chave original para o CSV final, mas usamos a norm para o merge
df_agrupado = df_dados.groupby(['bairro', 'classificacao_grupo', 'classificacao_cnae']).agg({
    'quantidade': 'sum'
}).reset_index()

df_agrupado['bairro_norm'] = df_agrupado['bairro'].apply(normalizar_nome)

# 4. Cruzamento
print("🔗 Cruzando dados...")
df_final = pd.merge(df_agrupado, df_censo_resumo, on='bairro_norm', how='left')

# Filtra sem dados e população zero
df_final = df_final.dropna(subset=['area_km2', 'Total_de_pessoas_2022'])
df_final = df_final[df_final['Total_de_pessoas_2022'] > 0]

# 5. Cálculos de Métricas
print("🧮 Calculando densidades...")

# Métrica Principal (Lojas por 10k habitantes)
df_final['densidade_por_10k'] = (
    df_final['quantidade'] / df_final['Total_de_pessoas_2022']
) * 10000

# Arredondar
df_final['densidade_por_10k'] = df_final['densidade_por_10k'].round(2)

# --- NOVO: Cálculo de Percentis e Labels (Tratamento de Outliers) ---
print("📊 Gerando percentis e labels...")

# Define os rótulos para os 5 quintis
labels_densidade = ["Muito Baixa", "Baixa", "Média", "Alta", "Muito Alta"]

# qcut divide em pedaços de tamanho igual (quantidade de bairros igual em cada faixa)
# Isso resolve o problema de Grumari, pois ele só será mais um "Muito Alta" junto com Copacabana
df_final['label_densidade'] = pd.qcut(
    df_final['densidade_por_10k'].rank(method='first'), # Rank helps with duplicate edges
    q=5, 
    labels=labels_densidade
)

# Adiciona o número do percentil (0 a 1) para uso em gradientes de cor no front
df_final['percentil_densidade'] = df_final['densidade_por_10k'].rank(pct=True).round(2)


# 6. Limpeza e Salvamento
colunas_saida = [
    'bairro', 
    'classificacao_grupo', 
    'classificacao_cnae', 
    'quantidade', 
    'Total_de_pessoas_2022', 
    'densidade_por_10k',
    'percentil_densidade', # Novo: Valor de 0.00 a 1.00 (Ótimo para opacidade/cor)
    'label_densidade'      # Novo: Texto (Ótimo para legenda/tooltip)
]

df_final = df_final[colunas_saida]
df_final.to_csv(CAMINHO_SAIDA, index=False)

print(f"✅ Sucesso! Arquivo gerado com labels em: {CAMINHO_SAIDA}")
print(df_final.head(10))