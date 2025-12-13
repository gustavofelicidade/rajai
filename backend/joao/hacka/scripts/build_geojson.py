#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import pandas as pd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="CSV geocodificado (com lat/lon)")
    ap.add_argument("--output", required=True, help="GeoJSON de saída (ex.: map/feiras_rio.geojson)")
    args = ap.parse_args()

    df = pd.read_csv(args.input)

    # Normaliza nomes possíveis
    # (caso seu CSV esteja em maiúsculas ou com variações)
    rename_map = {}
    if "ENDERECO" in df.columns and "endereco" not in df.columns:
        rename_map["ENDERECO"] = "endereco"
    if "BAIRRO" in df.columns and "bairro" not in df.columns:
        rename_map["BAIRRO"] = "bairro"
    if "DIA" in df.columns and "dia" not in df.columns:
        rename_map["DIA"] = "dia"
    if "HORARIO" in df.columns and "horario" not in df.columns:
        rename_map["HORARIO"] = "horario"
    if "RA" in df.columns and "ra" not in df.columns:
        rename_map["RA"] = "ra"
    df = df.rename(columns=rename_map)

    required = ["endereco", "bairro", "dia", "horario", "ra", "id", "lat", "lon"]
    for c in required:
        if c not in df.columns:
            df[c] = ""

    # Campos opcionais (se existirem)
    opt_cols = ["geocode_status", "geocode_precision", "geocode_provider", "geocode_query"]

    features = []
    for _, r in df.iterrows():
        lat = r.get("lat")
        lon = r.get("lon")
        try:
            lat = float(lat)
            lon = float(lon)
        except Exception:
            continue  # pula sem coordenadas

        props = {
            "id": str(r.get("id", "")),
            "endereco": str(r.get("endereco", "")),
            "bairro": str(r.get("bairro", "")),
            "dia": str(r.get("dia", "")),
            "horario": str(r.get("horario", "")),
            "ra": str(r.get("ra", "")),
        }
        for c in opt_cols:
            if c in df.columns:
                props[c] = "" if pd.isna(r.get(c)) else str(r.get(c))

        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": props
        })

    out = {"type": "FeatureCollection", "features": features}

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"OK: {args.output} ({len(features)} pontos)")


if __name__ == "__main__":
    main()