#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import os
import random
import time
from typing import Any, Dict, Optional, Tuple

import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable, GeocoderServiceError


DEFAULT_SUFFIX = "Rio de Janeiro, RJ, Brasil"


def load_cache(path: str) -> Dict[str, Any]:
    if not path or not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_cache(path: str, cache: Dict[str, Any]) -> None:
    if not path:
        return
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def build_queries(row: pd.Series) -> Tuple[str, str]:
    endereco = str(row.get("endereco", "")).strip()
    bairro = str(row.get("bairro", "")).strip()

    q1 = ", ".join([p for p in [endereco, bairro, DEFAULT_SUFFIX] if p])
    q2 = ", ".join([p for p in [bairro, DEFAULT_SUFFIX] if p])

    return q1, q2


def infer_precision(raw: Dict[str, Any]) -> str:
    addr = (raw or {}).get("address") or {}
    if addr.get("house_number"):
        return "exact"
    if addr.get("road") or addr.get("pedestrian") or addr.get("footway"):
        return "street"
    if addr.get("suburb") or addr.get("neighbourhood"):
        return "neighborhood"
    return "unknown"


def geocode_with_retries(geolocator: Nominatim, query: str, max_retries: int, base_wait: float) -> Tuple[Optional[Any], str]:
    for attempt in range(max_retries + 1):
        try:
            loc = geolocator.geocode(query, addressdetails=True)
            if loc is None:
                return None, "not_found"
            return loc, "ok"
        except (GeocoderTimedOut, GeocoderUnavailable):
            if attempt >= max_retries:
                return None, "timeout"
            time.sleep(base_wait * (2 ** attempt) + random.uniform(0, 1.0))
        except (GeocoderServiceError,):
            if attempt >= max_retries:
                return None, "error"
            time.sleep(base_wait * (2 ** attempt) + random.uniform(0, 1.0))
        except Exception:
            return None, "error"
    return None, "error"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--cache", default="geocode_cache.json")
    ap.add_argument("--min-delay", type=float, default=1.2)
    ap.add_argument("--timeout", type=int, default=20)
    ap.add_argument("--max-retries", type=int, default=5)
    ap.add_argument("--base-wait", type=float, default=2.0)
    ap.add_argument("--save-every", type=int, default=10)
    ap.add_argument("--user-agent", default="feiras-rj-mvp")
    args = ap.parse_args()

    df = pd.read_csv(args.input)

    # garante colunas
    for col in ["endereco", "bairro", "dia", "horario", "ra", "id"]:
        if col not in df.columns:
            df[col] = ""

    for col in ["lat","lon","geocode_status","geocode_precision","geocode_provider","geocode_query"]:
        if col not in df.columns:
            df[col] = ""

    cache = load_cache(args.cache)

    geolocator = Nominatim(user_agent=args.user_agent, timeout=args.timeout)

    last_req = 0.0
    def enforce_delay():
        nonlocal last_req
        now = time.time()
        dt = now - last_req
        if dt < args.min_delay:
            time.sleep(args.min_delay - dt)
        last_req = time.time()

    total = len(df)
    for i, row in df.iterrows():
        # resume: se já ok, pula
        if str(row.get("geocode_status","")) == "ok" and str(row.get("lat","")) and str(row.get("lon","")):
            continue

        q1, q2 = build_queries(row)

        def from_cache(q: str):
            if q in cache:
                return cache[q]
            return None

        def store_cache(q: str, lat, lon, status, prec):
            cache[q] = {"lat": lat, "lon": lon, "status": status, "precision": prec}

        # tenta q1
        hit = from_cache(q1)
        if hit:
            lat, lon = hit["lat"], hit["lon"]
            status, prec = hit["status"], hit.get("precision","unknown")
            used = q1
        else:
            enforce_delay()
            loc, status = geocode_with_retries(geolocator, q1, args.max_retries, args.base_wait)
            if status == "ok" and loc:
                raw = getattr(loc, "raw", {}) or {}
                lat, lon = float(loc.latitude), float(loc.longitude)
                prec = infer_precision(raw)
            else:
                lat, lon = None, None
                prec = "unknown"
            store_cache(q1, lat, lon, status, prec)
            used = q1

        # fallback bairro
        if status != "ok":
            hit2 = from_cache(q2)
            if hit2:
                lat2, lon2 = hit2["lat"], hit2["lon"]
                status2, prec2 = hit2["status"], hit2.get("precision","unknown")
                used2 = q2
            else:
                enforce_delay()
                loc2, status2 = geocode_with_retries(geolocator, q2, args.max_retries, args.base_wait)
                if status2 == "ok" and loc2:
                    raw2 = getattr(loc2, "raw", {}) or {}
                    lat2, lon2 = float(loc2.latitude), float(loc2.longitude)
                    prec2 = infer_precision(raw2)
                else:
                    lat2, lon2 = None, None
                    prec2 = "unknown"
                store_cache(q2, lat2, lon2, status2, prec2)
                used2 = q2

            if status2 == "ok":
                lat, lon, status, prec, used = lat2, lon2, status2, prec2, used2

        df.at[i, "lat"] = lat if lat is not None else ""
        df.at[i, "lon"] = lon if lon is not None else ""
        df.at[i, "geocode_status"] = status
        df.at[i, "geocode_precision"] = prec
        df.at[i, "geocode_provider"] = "nominatim"
        df.at[i, "geocode_query"] = used

        if (i + 1) % 5 == 0:
            ok = int((df["geocode_status"] == "ok").sum())
            print(f"[{i+1}/{total}] ok={ok} last={status} ({used})")

        if (i + 1) % args.save_every == 0:
            df.to_csv(args.output, index=False)
            save_cache(args.cache, cache)

    df.to_csv(args.output, index=False)
    save_cache(args.cache, cache)
    print(f"OK: {args.output} | cache: {args.cache}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())