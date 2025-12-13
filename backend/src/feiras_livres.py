import requests
import pandas as pd
import sys

def buscar_feiras_osm():
    # 1. Endpoint da Overpass API (API oficial do OpenStreetMap)
    # É uma API pública, gratuita e super estável.
    url = "https://overpass-api.de/api/interpreter"

    print("🌍 Conectando à Overpass API (OpenStreetMap)...")

    # 2. A Query (Linguagem Overpass QL)
    # Tradução: "Dentro da área 'Rio de Janeiro', busque nós (pontos) 
    # que sejam 'amenity=marketplace' (feiras/mercados) OU 'shop=farm' (venda direta)."
    overpass_query = """
    [out:json][timeout:25];
    area["name"="Rio de Janeiro"]["admin_level"="8"]->.searchArea;
    (
      node["amenity"="marketplace"](area.searchArea);
      node["shop"="farm"](area.searchArea);
      way["amenity"="marketplace"](area.searchArea);
    );
    out center;
    """

    try:
        # 3. Faz a Requisição
        response = requests.get(url, params={'data': overpass_query})
        response.raise_for_status() # Garante que não houve erro 400/500
        
        data = response.json()

        # 4. Processa os dados (JSON -> Lista Limpa)
        elementos = data.get('elements', [])
        
        if not elementos:
            print("⚠️ A API respondeu, mas não encontrou feiras com esses filtros.")
            return None

        print(f"📦 Processando {len(elementos)} locais encontrados...")
        
        lista_feiras = []
        for item in elementos:
            # O OpenStreetMap guarda as infos dentro de 'tags'
            tags = item.get('tags', {})
            
            # Pega lat/long (se for 'way', o OSM manda o 'center')
            lat = item.get('lat') or item.get('center', {}).get('lat')
            lon = item.get('lon') or item.get('center', {}).get('lon')

            # Nome da feira (ou um nome genérico se não tiver)
            nome = tags.get('name', 'Feira/Mercado Local')
            
            # Tenta descobrir o bairro ou rua pelo endereço cadastrado no OSM
            endereco = tags.get('addr:street', tags.get('addr:suburb', 'Endereço não cadastrado'))

            lista_feiras.append({
                "id_osm": item['id'],
                "nome": nome,
                "endereco_referencia": endereco,
                "latitude": lat,
                "longitude": lon,
                "categoria": "Feira Livre / Mercado Popular",
                "fonte": "OpenStreetMap"
            })

        # 5. Cria DataFrame e Salva
        df = pd.DataFrame(lista_feiras)
        
        # Remove quem não tem coordenada (segurança)
        df = df.dropna(subset=['latitude', 'longitude'])
        
        print(f"✅ SUCESSO! {len(df)} pontos de feira extraídos.")
        return df

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro na conexão com a API: {e}")
        return None

# --- Execução ---
if __name__ == "__main__":
    df_resultado = buscar_feiras_osm()
    
    if df_resultado is not None:
        caminho_arquivo = "feiras_rio_osm.csv"
        df_resultado.to_csv(caminho_arquivo, index=False, encoding='utf-8-sig')
        print(f"\n📁 Arquivo salvo: {caminho_arquivo}")
        print(df_resultado.head())
    else:
        print("\n🛑 Falha na execução.")