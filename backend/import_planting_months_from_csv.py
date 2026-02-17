#!/usr/bin/env python3
"""
Import planting months from a CSV into variedades.
Matches CSV rows to especies by nombre_comun (normalized).
"""

from __future__ import annotations

import argparse
import csv
import unicodedata
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import Especie, Variedad


MonthList = Optional[list[int]]


def normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    normalized = normalized.lower()
    normalized = "".join(char for char in normalized if char.isalnum() or char.isspace())
    normalized = " ".join(normalized.split())
    return normalized


NAME_ALIASES: Dict[str, str] = {
    "clavel del poeta": "clavel",
    "hinojo": "hinojo de bulbo",
    "melon": "melones",
    "mostaza": "mostaza de hoja",
    "pak choi": "pak choi",
    "pak-choi": "pak choi",
    "pakchoi": "pak choi",
    "pimiento": "pimientos",
    "romanoesco": "romanesco",
    "rabano": "rabanos",
    "tomate": "tomates",
    "vinagreira": "acedera",
}

MISSING_DEFAULTS: Dict[str, Tuple[MonthList, MonthList]] = {
    "chumbera": ([2, 3, 4], [4, 5, 6]),
    "durillo": ([2, 3, 4], [4, 5]),
}


def parse_months(value: str) -> MonthList:
    if not value:
        return None
    raw_items = [item.strip() for item in value.split(",") if item.strip()]
    if not raw_items:
        return None
    months: list[int] = []
    for item in raw_items:
        try:
            month = int(item)
        except ValueError:
            continue
        if 1 <= month <= 12 and month not in months:
            months.append(month)
    return sorted(months) if months else None


def load_csv(path: Path) -> Dict[str, Tuple[MonthList, MonthList, str]]:
    rows: Dict[str, Tuple[MonthList, MonthList, str]] = {}
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("nombre") or row.get("name") or "").strip()
            if not name:
                continue
            interior = parse_months((row.get("meses_siembra_interior") or "").strip())
            exterior = parse_months((row.get("meses_siembra_exterior") or "").strip())
            key = normalize_name(name)
            rows[key] = (interior, exterior, name)
    for key, (interior, exterior) in MISSING_DEFAULTS.items():
        if key not in rows:
            rows[key] = (interior, exterior, key)
    return rows


def update_variedades(
    especies: Iterable[Especie],
    csv_rows: Dict[str, Tuple[MonthList, MonthList, str]],
    overwrite_empty: bool
) -> Tuple[int, int, set[str], set[str]]:
    updated_variedades = 0
    matched_especies = 0
    matched_csv_names: set[str] = set()
    unmatched_db_names: set[str] = set()

    db = SessionLocal()
    try:
        for especie in especies:
            normalized = normalize_name(especie.nombre_comun)
            lookup_name = NAME_ALIASES.get(normalized, normalized)
            if lookup_name not in csv_rows:
                unmatched_db_names.add(especie.nombre_comun)
                continue

            interior, exterior, original_name = csv_rows[lookup_name]
            matched_csv_names.add(original_name)
            matched_especies += 1

            variedades = db.query(Variedad).filter(Variedad.especie_id == especie.id).all()
            for variedad in variedades:
                if interior is not None or overwrite_empty:
                    variedad.meses_siembra_interior = interior or []
                if exterior is not None or overwrite_empty:
                    variedad.meses_siembra_exterior = exterior or []
                updated_variedades += 1

        db.commit()
    finally:
        db.close()

    unmatched_csv_names = {info[2] for key, info in csv_rows.items() if info[2] not in matched_csv_names}
    return matched_especies, updated_variedades, unmatched_csv_names, unmatched_db_names


def main() -> None:
    parser = argparse.ArgumentParser(description="Import planting months from CSV into variedades")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default=str(Path(__file__).resolve().parents[1] / "huerta_vitoria_374_variedades_COMPLETO_v2.csv"),
        help="Path to CSV with months",
    )
    parser.add_argument(
        "--overwrite-empty",
        action="store_true",
        help="Overwrite empty months with [] instead of leaving current values",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    csv_rows = load_csv(csv_path)
    db = SessionLocal()
    try:
        especies = db.query(Especie).all()
    finally:
        db.close()

    matched_especies, updated_variedades, unmatched_csv_names, unmatched_db_names = update_variedades(
        especies,
        csv_rows,
        args.overwrite_empty,
    )

    print(f"Matched especies: {matched_especies}")
    print(f"Updated variedades: {updated_variedades}")
    print(f"CSV rows without match in DB: {len(unmatched_csv_names)}")
    if unmatched_csv_names:
        print("- " + "\n- ".join(sorted(unmatched_csv_names, key=str.lower)))
    print(f"DB especies without match in CSV: {len(unmatched_db_names)}")
    if unmatched_db_names:
        print("- " + "\n- ".join(sorted(unmatched_db_names, key=str.lower)))


if __name__ == "__main__":
    main()
