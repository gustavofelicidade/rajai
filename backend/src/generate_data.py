import os
import pandas as pd
import numpy as np
import rasterio
from rasterio.transform import from_origin
import config  # Importando suas configurações do Rio

def gerar_dados_teste(qtd_imagens=100):
    print(f"--- Gerando dados simulados do Sentinel-2 ---")
    print(f"Diretório: {config.PROCESSED_DIR}")
    print(f"Bandas: {config.SENTINEL_BANDS}")
    print(f"Tamanho: {config.IMAGE_SIZE}x{config.IMAGE_SIZE}")
    
    # Garante que a pasta existe
    os.makedirs(config.PROCESSED_DIR, exist_ok=True)
    
    data = []
    classes_disponiveis = list(config.CLASSES_MAP.keys()) # [0, 1, 2, 3]
    
    for i in range(qtd_imagens):
        filename = f"rio_sentinel_mock_{i:03d}.tif"
        filepath = os.path.join(config.PROCESSED_DIR, filename)
        
        # 1. Escolher uma classe aleatória baseada no seu mapa
        label = np.random.choice(classes_disponiveis)
        
        # 2. Simular Imagem (4 bandas, 64x64 pixels)
        # Sentinel é uint16. Geramos ruído aleatório para simular textura.
        num_bandas = len(config.SENTINEL_BANDS)
        size = config.IMAGE_SIZE
        
        # Cria array (Bandas, Altura, Largura)
        array = np.random.randint(0, 8000, size=(num_bandas, size, size)).astype('uint16')
        
        # Truque: Se for "In Natura" (Vegetação/Verde), aumentar valor na banda B03 (Green) e B08 (NIR)
        # Só para o modelo ter algo padrão para aprender no teste
        if label == 1: 
            array[1] += 2000 # B03 Green
            array[3] += 3000 # B08 NIR
            
        # 3. Salvar como TIF Geoespacial
        # Usamos coordenadas fictícias do Rio apenas para constar nos metadados
        transform = from_origin(680000, 7460000, 10, 10) 
        
        with rasterio.open(
            filepath, 'w', driver='GTiff',
            height=size, width=size,
            count=num_bandas, dtype=array.dtype,
            crs='+proj=utm +zone=23 +south +ellps=GRS80 +units=m +no_defs', # UTM 23S (Rio)
            transform=transform
        ) as dst:
            dst.write(array)
            
        data.append([filename, label])

    # Salvar o CSV de referência
    csv_path = os.path.join(config.DATA_DIR, 'dataset_labels.csv')
    df = pd.DataFrame(data, columns=['filename', 'label'])
    df.to_csv(csv_path, index=False)
    
    print(f"Concluído! {qtd_imagens} imagens geradas.")
    print(f"Arquivo de labels salvo em: {csv_path}")

if __name__ == "__main__":
    gerar_dados_teste()