import pandas as pd
import unicodedata
from pathlib import Path

# --- Configuração dos Arquivos ---
BASE_DIR = Path.cwd()
ARQUIVO_PRINCIPAL = BASE_DIR / "dados" / "dados.csv"
ARQUIVO_INFORMAIS = BASE_DIR / "dados" / "csv_informais.csv"
ARQUIVO_SAIDA = BASE_DIR / "dados" / "dados_consolidado.csv"

def normalizar_texto(texto):
    """Converte para MAIÚSCULA e remove acentos (Ex: 'São Cristóvão' -> 'SAO CRISTOVAO')"""
    if not isinstance(texto, str):
        return ""
    # 1. Normaliza unicode (separa acentos das letras)
    nfkd = unicodedata.normalize('NFKD', texto)
    # 2. Filtra caracteres de acentuação
    texto_sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    # 3. Converte para maiúsculo e remove espaços nas pontas
    return texto_sem_acento.upper().strip()

def unificar_bases():
    print("🔄 Iniciando unificação de bases...")

    # 1. Carregar os Informais
    try:
        df_informais = pd.read_csv(ARQUIVO_INFORMAIS, sep=';', encoding='utf-8')
    except:
        df_informais = pd.read_csv(ARQUIVO_INFORMAIS, sep=';', encoding='latin1')

    print(f"✅ Informais carregados: {len(df_informais)} registros.")

    # --- CORREÇÃO SOLICITADA: CAPS LOCK + NORMALIZAÇÃO ---
    # Aplica a função em todos os bairros antes de agrupar
    df_informais['bairro'] = df_informais['bairro'].apply(normalizar_texto)
    print("✅ Nomes de bairros convertidos para MAIÚSCULAS.")

    # 2. Agrupar e Contar (Transforma lista de endereços em contagem)
    df_informais_agrupado = df_informais.groupby(
        ['bairro', 'classificacao_grupo', 'classificacao_cnae']
    ).size().reset_index(name='quantidade')

    # Cria colunas extras para compatibilidade
    for col in ['Total_de_pessoas_2022', 'densidade_por_10k', 'percentil_densidade', 'label_densidade']:
        df_informais_agrupado[col] = 0 

    # 3. Carregar Principal e Unificar
    if ARQUIVO_PRINCIPAL.exists():
        df_principal = pd.read_csv(ARQUIVO_PRINCIPAL, sep=',')
    else:
        df_principal = pd.DataFrame()

    # Concatenar
    df_final = pd.concat([df_principal, df_informais_agrupado], ignore_index=True)

    # 4. (Opcional) Agrupar novamente caso haja repetição de Bairro+Tipo nos dois arquivos
    # Isso garante que se já tinha "Tijuca - Feira" no principal, soma com o novo.
    cols_agrupamento = ['bairro', 'classificacao_grupo', 'classificacao_cnae']
    # Mantemos as outras colunas pegando o valor máximo (para preservar dados do censo se existirem) ou recriando
    df_final = df_final.groupby(cols_agrupamento, as_index=False).agg({
        'quantidade': 'sum',
        'Total_de_pessoas_2022': 'max', # Preserva o dado se já existia
        'densidade_por_10k': 'max',
        'percentil_densidade': 'max',
        'label_densidade': 'first'
    })

    # 5. Salvar
    df_final.to_csv(ARQUIVO_SAIDA, index=False, encoding='utf-8')
    print(f"\n🚀 Sucesso! Arquivo gerado: {ARQUIVO_SAIDA}")
    print(f"📊 Total de linhas consolidadas: {len(df_final)}")

if __name__ == "__main__":
    unificar_bases()