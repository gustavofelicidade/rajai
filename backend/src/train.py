# src/train.py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import os

from model import FoodDesertClassifier
from data_prep import SentinelDataset  # <--- Faltava importar isso!
import config

def train_model():
    # --- CONFIGURAÇÕES ---
    BATCH_SIZE = 16
    LEARNING_RATE = 0.001
    EPOCHS = 10
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Usando dispositivo: {DEVICE}")

    # --- 1. PREPARAR DADOS ---
    # Caminho para o CSV que a outra pessoa vai te entregar
    # Formato esperado do CSV: coluna 'filename' (ex: image_01.tif) e 'label' (ex: 2)
    csv_path = os.path.join(config.DATA_DIR, 'dataset_labels.csv')
    img_dir = config.PROCESSED_DIR

    # Verifica se os dados existem antes de tentar carregar
    if not os.path.exists(csv_path):
        print(f"ERRO: Arquivo de dados não encontrado em {csv_path}")
        print("Gere dados de teste primeiro (veja o script abaixo) ou adicione os dados reais.")
        return

    full_dataset = SentinelDataset(metadata_file=csv_path, root_dir=img_dir)

    # Dividir em Treino (80%) e Validação (20%)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # --- 2. INICIALIZAR MODELO ---
    model = FoodDesertClassifier(num_classes=4, input_channels=4) # 4 classes do seu CNAE, 4 canais do Sentinel
    model = model.to(DEVICE)

    # Função de Perda (Para classificação multiclasse)
    criterion = nn.CrossEntropyLoss()
    # Otimizador Adam
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # --- 3. LOOP DE TREINAMENTO ---
    print("Iniciando treinamento...")
    
    for epoch in range(EPOCHS):
        model.train() # Coloca em modo de treino
        running_loss = 0.0
        
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)

            # Zerar gradientes
            optimizer.zero_grad()

            # Forward pass (Previsão)
            outputs = model(images)
            
            # Calcular erro
            loss = criterion(outputs, labels)
            
            # Backward pass (Backpropagation)
            loss.backward()
            
            # Atualizar pesos
            optimizer.step()

            running_loss += loss.item()

        # --- VALIDAÇÃO (Ao final de cada época) ---
        model.eval() # Modo de avaliação
        val_acc = 0.0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                val_acc += (predicted == labels).sum().item()

        avg_loss = running_loss / len(train_loader)
        acc_percent = 100 * val_acc / total
        
        print(f"Época [{epoch+1}/{EPOCHS}] - Loss: {avg_loss:.4f} - Acurácia Validação: {acc_percent:.2f}%")

    # --- 4. SALVAR O MODELO ---
    model_save_path = os.path.join(config.BASE_DIR, 'models', 'sentinel_model.pth')
    torch.save(model.state_dict(), model_save_path)
    print(f"Modelo salvo em: {model_save_path}")

if __name__ == "__main__":
    train_model()