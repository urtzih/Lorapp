#!/usr/bin/env python3
"""
Generate a CSV template to fill planting months.
Combines species names from DB and the SFG CSV.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Iterable

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import Especie


def load_db_species() -> list[str]:
    db = SessionLocal()
    try:
        return [row[0] for row in db.query(Especie.nombre_comun).all() if row[0]]
    finally:
        db.close()


def load_sfg_species(csv_path: Path) -> list[str]:
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return []

    names: list[str] = []
    with csv_path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            name = (row.get("name") or "").strip()
            if name:
                names.append(name)
    return names


def unique_preserve_order(items: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = item.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(item.strip())
    return result


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    sfg_csv = repo_root / "plants_sfg.csv"
    output_csv = repo_root / "planting_months_template.csv"

    db_species = load_db_species()
    sfg_species = load_sfg_species(sfg_csv)

    combined = unique_preserve_order(db_species + sfg_species)

    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["name", "meses_siembra_interior", "meses_siembra_exterior"])
        for name in sorted(combined, key=lambda value: value.lower()):
            writer.writerow([name, "", ""])

    print(f"Template generated: {output_csv}")
    print(f"Total species: {len(combined)}")


if __name__ == "__main__":
    main()
