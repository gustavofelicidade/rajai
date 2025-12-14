#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import argparse
from geopy.geocoders import Nominatim

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mistakes", default="scripts/overrides.json")
    ap.add_argument("--out", default="scripts/overrides.json")
    ap.add_argument("--timeout", type=int, default=20)
    ap.add_argument("--user-agent", default="feiras-rj-mistakes")
    args = ap.parse_args()

    with open(args.mistakes, "r", encoding="utf-8") as f:
        ov = json.load(f)

    geolocator = Nominatim(user_agent=args.user_agent, timeout=args.timeout)

    changed = 0
    for fid, item in ov.items():
        if item.get("lat") is not None and item.get("lon") is not None:
            continue
        q = item["query"]
        loc = geolocator.geocode(q, addressdetails=True)
        if not loc:
            print(f"[WARN] não achei: {fid} -> {q}")
            continue
        item["lat"] = float(loc.latitude)
        item["lon"] = float(loc.longitude)
        changed += 1
        print(f"[OK] {fid}: {item['lat']},{item['lon']}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(ov, f, ensure_ascii=False, indent=2)

    print(f"Feito. Atualizados: {changed}")

if __name__ == "__main__":
    main()