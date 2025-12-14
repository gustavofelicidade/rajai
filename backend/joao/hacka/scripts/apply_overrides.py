#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import pandas as pd

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="CSV geocodificado (ex: feiras_rio_geocoded.csv)")
    ap.add_argument("--output", required=True, help="CSV corrigido (ex: feiras_rio_geocoded_fixed.csv)")
    ap.add_argument("--overrides", default="scripts/overrides.json")
    args = ap.parse_args()

    df = pd.read_csv(args.input)

    with open(args.overrides, "r", encoding="utf-8") as f:
        ov = json.load(f)

    if "id" not in df.columns:
        raise SystemExit("CSV precisa ter coluna 'id'")

    hits = 0
    for fid, item in ov.items():
        lat = item.get("lat")
        lon = item.get("lon")
        if lat is None or lon is None:
            continue
        mask = df["id"].astype(str) == str(fid)
        if mask.any():
            df.loc[mask, "lat"] = lat
            df.loc[mask, "lon"] = lon
            df.loc[mask, "geocode_status"] = "override"
            df.loc[mask, "geocode_precision"] = "exact"
            df.loc[mask, "geocode_provider"] = "manual_override"
            df.loc[mask, "geocode_query"] = item.get("query", "")
            hits += int(mask.sum())

    df.to_csv(args.output, index=False)
    print(f"OK: {args.output} | overrides aplicados em {hits} linha(s)")

if __name__ == "__main__":
    main()