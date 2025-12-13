# src/dataset.py
import torch
from torch.utils.data import Dataset
import rasterio
import numpy as np
import os
import pandas as pd

class SentinelDataset(Dataset):
    def __init__(self, metadata_file, root_dir, transform=None):
        """
        Args:
            metadata_file (string): Caminho para o arquivo CSV com (nome_arquivo, classe).
            root_dir (string): Diretório onde estão as imagens .tif.
            transform (callable, optional): Transformações/Augmentations opcionais.
        """
        self.labels_frame = pd.read_csv(metadata_file)
        self.root_dir = root_dir
        self.transform = transform

    def __len__(self):
        return len(self.labels_frame)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()

        # Pega o nome do arquivo na coluna 'filename' do CSV
        img_name = os.path.join(self.root_dir, self.labels_frame.iloc[idx, 0])
        
        # Pega a classe na coluna 'label' (0, 1, 2 ou 3)
        label = int(self.labels_frame.iloc[idx, 1])

        # Abre a imagem GeoTIFF usando Rasterio
        # Sentinel-2 tem várias bandas, aqui assumimos que o arquivo salvo já tem 
        # as 4 bandas que queremos (R, G, B, NIR) empilhadas.
        with rasterio.open(img_name) as src:
            # Lê as bandas como float32
            image = src.read().astype(np.float32)

        # NORMALIZAÇÃO (Crítico para Satélite)
        # O Sentinel-2 raw values vão até ~10000 para reflectância 100%.
        # Vamos dividir por 4000 (um valor típico de max para áreas urbanas/vegetação não nuvem)
        # para deixar os valores próximos de 0 e 1.
        image = image / 4000.0 
        
        # Clip para garantir que nada passe de 1.0 (ex: telhados muito brancos)
        image = np.clip(image, 0, 1.0)

        # Converte para Tensor do PyTorch
        image = torch.from_numpy(image)

        if self.transform:
            image = self.transform(image)

        return image, label