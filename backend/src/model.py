# src/model.py
import torch
import torch.nn as nn
from torchvision import models

class FoodDesertClassifier(nn.Module):
    def __init__(self, num_classes=4, input_channels=4):
        """
        Args:
            num_classes: 4 (Sem dados, In Natura, Ultraprocessados, Mistos)
            input_channels: 4 (R, G, B, NIR do Sentinel-2)
        """
        super(FoodDesertClassifier, self).__init__()
        
        # 1. Carregar uma ResNet18 pré-treinada
        # Usamos weights='DEFAULT' para pegar os pesos mais atuais
        self.network = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        
        # 2. Adaptar a primeira camada (entrada)
        # A ResNet original espera 3 canais (RGB). Nós temos 4 (RGB + NIR).
        # Vamos substituir a primeira convolução para aceitar 4 canais.
        original_first_layer = self.network.conv1
        self.network.conv1 = nn.Conv2d(
            in_channels=input_channels,
            out_channels=original_first_layer.out_channels,
            kernel_size=original_first_layer.kernel_size,
            stride=original_first_layer.stride,
            padding=original_first_layer.padding,
            bias=False
        )
        
        # Inicializar os pesos da nova camada (média dos pesos RGB para o NIR)
        # Isso ajuda o modelo a não começar do zero absoluto nessa camada
        with torch.no_grad():
            self.network.conv1.weight[:, :3] = original_first_layer.weight
            self.network.conv1.weight[:, 3] = original_first_layer.weight.mean(dim=1)

        # 3. Adaptar a última camada (saída/classificador)
        # A ResNet original classifica 1000 coisas (ImageNet). Nós queremos apenas 4.
        num_features = self.network.fc.in_features
        self.network.fc = nn.Sequential(
            nn.Dropout(0.5), # Ajuda a evitar overfitting em datasets pequenos
            nn.Linear(num_features, num_classes)
        )

    def forward(self, x):
        return self.network(x)

# Teste rápido para ver se funciona (Rode isso direto no python para testar)
if __name__ == "__main__":
    # Simula um batch de 8 imagens, com 4 canais, tamanho 64x64
    dummy_input = torch.randn(8, 4, 64, 64)
    model = FoodDesertClassifier()
    output = model(dummy_input)
    print("Shape da saída:", output.shape) # Deve ser [8, 4]
    print("Modelo construído com sucesso!")