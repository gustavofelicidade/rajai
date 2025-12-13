import torch
import os
import rasterio
import numpy as np
import config
from model import FoodDesertClassifier

def predict_image(image_path):
    print(f"--- Analisando imagem: {os.path.basename(image_path)} ---")

    # 1. Configurar o dispositivo (CPU ou GPU)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 2. Carregar a estrutura do modelo
    # Precisamos instanciar a classe igualzinho fizemos no treino
    model = FoodDesertClassifier(num_classes=4, input_channels=4)
    
    # 3. Carregar os pesos treinados (.pth)
    model_path = os.path.join(config.BASE_DIR, 'models', 'sentinel_model.pth')
    
    try:
        model.load_state_dict(torch.load(model_path, map_location=device))
        print("Modelo carregado com sucesso!")
    except FileNotFoundError:
        print("ERRO: Modelo não encontrado. Rode o train.py primeiro.")
        return

    model.to(device)
    model.eval() # IMPORTANTE: Coloca em modo de previsão (trava os pesos)

    # 4. Preparar a imagem (mesmo pré-processamento do dataset.py)
    if not os.path.exists(image_path):
        print(f"Imagem não encontrada: {image_path}")
        return

    with rasterio.open(image_path) as src:
        # Lê a imagem e converte para Float32
        image = src.read().astype(np.float32)
        # Normaliza (dividir por 10000 igual no treino)
        image = image / 10000.0

    # O PyTorch espera um lote (Batch) de imagens. 
    # Adicionamos uma dimensão extra: (4, 64, 64) -> (1, 4, 64, 64)
    image_tensor = torch.from_numpy(image).unsqueeze(0).to(device)

    # 5. Fazer a previsão
    with torch.no_grad(): # Desliga o cálculo de gradiente para economizar memória
        outputs = model(image_tensor)
        
        # Pega a classe com maior probabilidade
        _, predicted_idx = torch.max(outputs, 1)
        predicted_index = predicted_idx.item()

    # 6. Traduzir o número para o nome da classe
    class_name = config.CLASSES_MAP.get(predicted_index, "Desconhecido")
    
    print(f"\nRESULTADO DA ANÁLISE:")
    print(f"Predição: Classe {predicted_index} -> {class_name}")
    print("-" * 30)

if __name__ == "__main__":
    # Vamos testar com uma das imagens falsas que geramos
    # Pegando a imagem 005 como exemplo
    test_image = os.path.join(config.PROCESSED_DIR, "rio_sentinel_mock_005.tif")
    
    predict_image(test_image)