import pandas as pd

df = pd.read_csv("feiras_rio_geocoded.csv")

# 1. Corrige typo ndereco -> endereco
if "ndereco" in df.columns:
    df.rename(columns={"ndereco": "endereco"}, inplace=True)

# 2. Remove coluna precision vazia
if "precision" in df.columns:
    if df["precision"].isna().all() or (df["precision"] == "").all():
        df.drop(columns=["precision"], inplace=True)

# 3. Garante colunas essenciais
required = [
    "endereco","bairro","dia","horario","ra",
    "cidade","uf","pais",
    "endereco_completo",
    "lat","lon",
    "geocode_status","geocode_precision",
    "geocode_provider","geocode_query","id"
]

for col in required:
    if col not in df.columns:
        df[col] = ""

df.to_csv("feiras_rio_geocoded_fixed.csv", index=False)
print("✔ Schema corrigido → feiras_rio_geocoded_fixed.csv")