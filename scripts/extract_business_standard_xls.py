import json
import math
import re
import sys
from pathlib import Path

from extract_jira_xls import excel_date, parse_xls, read_cfb_stream


def to_number(value, default=0):
    try:
        result = float(value)
        return result if math.isfinite(result) else default
    except (TypeError, ValueError):
        return default


def text(row, idx, name, default=""):
    i = idx.get(name)
    if i is None or i >= len(row):
        return default
    return str(row[i] or "").strip()


def value(row, idx, name, default=""):
    i = idx.get(name)
    if i is None or i >= len(row):
        return default
    return row[i]


def item_id(key):
    return "business-" + re.sub(r"[^a-zA-Z0-9]+", "-", key).strip("-").lower()


def build_typescript(rows, output_path):
    header = [str(cell).strip() for cell in rows[0]]
    idx = {name: i for i, name in enumerate(header)}
    required = ["Код", "Тема", "Статус", "T2M_p_Dash", "Создание", "TIHold", "Продукт", "Ключевой результат", "Epic Q"]
    missing = [name for name in required if name not in idx]
    if missing:
        raise ValueError(f"В файле не найдены колонки: {', '.join(missing)}")

    items = []
    for row in rows[1:]:
        key = text(row, idx, "Код")
        if not key:
            continue

        items.append(
            {
                "id": item_id(key),
                "key": key,
                "title": text(row, idx, "Тема"),
                "status": text(row, idx, "Статус"),
                "streamName": text(row, idx, "Продукт") or "Не указано",
                "keyResult": text(row, idx, "Ключевой результат"),
                "epicQuarter": text(row, idx, "Epic Q") or "Не указано",
                "createdAt": excel_date(value(row, idx, "Создание")),
                "ttmDays": round(to_number(value(row, idx, "T2M_p_Dash"))),
                "idleDays": round(to_number(value(row, idx, "TIHold"))),
            }
        )

    content = 'import type { BusinessStandardItem } from "../types";\n\n'
    content += "export const businessStandardItems: BusinessStandardItem[] = "
    content += json.dumps(items, ensure_ascii=False, indent=2)
    content += ";\n"
    Path(output_path).write_text(content, encoding="utf-8")

    return {
        "items": len(items),
        "streams": sorted({item["streamName"] for item in items}),
        "quarters": sorted({item["epicQuarter"] for item in items}),
    }


if __name__ == "__main__":
    workbook = read_cfb_stream(sys.argv[1])
    rows = parse_xls(workbook)
    summary = build_typescript(rows, sys.argv[2])
    print(json.dumps(summary, ensure_ascii=False, indent=2))
