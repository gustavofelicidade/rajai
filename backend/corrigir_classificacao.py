import pandas as pd
from pathlib import Path

def gerar_versao_final():
    # Caminhos
    BASE_DIR = Path.cwd()
    ARQUIVO_ENTRADA = BASE_DIR / "dados" / "dados.csv"
    ARQUIVO_SAIDA = BASE_DIR / "dados" / "dados_final_rajai.csv" # Nome novo!

    if not ARQUIVO_ENTRADA.exists():
        print(f"❌ Erro: Não encontrei {ARQUIVO_ENTRADA}")
        return

    print("🔄 Lendo base consolidada...")
    df = pd.read_csv(ARQUIVO_ENTRADA)

    # --- A CORREÇÃO DE CLASSIFICAÇÃO ---
    # Identifica Restaurantes e Lanchonetes
    filtro_restaurantes = df['classificacao_cnae'].str.contains('Restaurante|Lanchonete', case=False, na=False)
    
    qtd_antes = df[df['classificacao_grupo'] == 'Misto'].shape[0]
    
    # Aplica a mudança apenas nessas linhas
    # De "Ultraprocessado" (ou qualquer outra coisa) -> Para "Misto"
    df.loc[filtro_restaurantes, 'classificacao_grupo'] = 'Misto'

    qtd_depois = df[df['classificacao_grupo'] == 'Misto'].shape[0]
    mudancas = qtd_depois - qtd_antes

    # --- SALVAR NOVO ARQUIVO ---
    df.to_csv(ARQUIVO_SAIDA, index=False, encoding='utf-8')

    print("="*50)
    print("✅ NOVA BASE GERADA COM SUCESSO!")
    print("="*50)
    print(f"📁 Arquivo criado: {ARQUIVO_SAIDA}")
    print(f"🔄 Total de estabelecimentos reclassificados para 'Misto': {mudancas}")
    print(f"📊 Total de linhas na base final: {len(df)}")
    print("-" * 50)
    
    # Preview para conferência
    print("Exemplo de Restaurante na nova base:")
    print(df[filtro_restaurantes][['bairro', 'classificacao_cnae', 'classificacao_grupo']].head(3))

if __name__ == "__main__":
    gerar_versao_final()