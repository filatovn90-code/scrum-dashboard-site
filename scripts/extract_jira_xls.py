import datetime as _dt
import json
import math
import re
import statistics
import struct
import sys
from pathlib import Path

END_OF_CHAIN = 0xFFFFFFFE
FREE_SECTOR = 0xFFFFFFFF


def _u16(data, offset):
    return struct.unpack_from("<H", data, offset)[0]


def _u32(data, offset):
    return struct.unpack_from("<I", data, offset)[0]


def _i32(data, offset):
    return struct.unpack_from("<i", data, offset)[0]


def _f64(data, offset):
    return struct.unpack_from("<d", data, offset)[0]


def _sector(data, sid, sector_size):
    start = (sid + 1) * sector_size
    return data[start : start + sector_size]


def _chain(fat, start):
    out = []
    sid = start
    while sid not in (END_OF_CHAIN, FREE_SECTOR) and sid < len(fat):
        out.append(sid)
        sid = fat[sid]
    return out


def read_cfb_stream(path, stream_names=("Workbook", "Book")):
    data = Path(path).read_bytes()
    if data[:8] != b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        raise ValueError("Файл не похож на бинарный Excel .xls")

    sector_size = 1 << _u16(data, 30)
    first_dir_sector = _u32(data, 48)
    fat_sector_count = _u32(data, 44)
    difat = [_u32(data, 76 + i * 4) for i in range(109)]
    fat_sector_ids = [sid for sid in difat if sid != FREE_SECTOR][:fat_sector_count]

    fat = []
    for sid in fat_sector_ids:
        sec = _sector(data, sid, sector_size)
        fat.extend(_u32(sec, i) for i in range(0, len(sec), 4))

    dir_data = b"".join(_sector(data, sid, sector_size) for sid in _chain(fat, first_dir_sector))
    streams = {}
    for offset in range(0, len(dir_data), 128):
        entry = dir_data[offset : offset + 128]
        name_len = _u16(entry, 64)
        if name_len < 2:
            continue
        name = entry[: name_len - 2].decode("utf-16le", errors="ignore")
        entry_type = entry[66]
        start_sector = _u32(entry, 116)
        size = struct.unpack_from("<Q", entry, 120)[0]
        if entry_type == 2:
            streams[name] = (start_sector, size)

    for name in stream_names:
        if name in streams:
            start, size = streams[name]
            stream = b"".join(_sector(data, sid, sector_size) for sid in _chain(fat, start))
            return stream[:size]

    raise ValueError("Не найден поток Workbook внутри .xls")


class ChunkReader:
    def __init__(self, chunks):
        self.chunks = chunks
        self.index = 0
        self.pos = 0

    def read(self, size):
        parts = []
        remaining = size
        while remaining > 0 and self.index < len(self.chunks):
            chunk = self.chunks[self.index]
            take = min(remaining, len(chunk) - self.pos)
            if take:
                parts.append(chunk[self.pos : self.pos + take])
                self.pos += take
                remaining -= take
            if self.pos >= len(chunk):
                self.index += 1
                self.pos = 0
        return b"".join(parts)

    def read_chars(self, count, high_byte):
        parts = []
        remaining = count
        is_16 = high_byte
        while remaining > 0 and self.index < len(self.chunks):
            chunk = self.chunks[self.index]
            width = 2 if is_16 else 1
            available_chars = (len(chunk) - self.pos) // width
            take_chars = min(remaining, available_chars)
            take_bytes = take_chars * width
            if take_bytes:
                raw = chunk[self.pos : self.pos + take_bytes]
                parts.append(raw.decode("utf-16le" if is_16 else "cp1251", errors="ignore"))
                self.pos += take_bytes
                remaining -= take_chars
            if remaining > 0 and self.pos >= len(chunk):
                self.index += 1
                self.pos = 0
                if self.index < len(self.chunks) and len(self.chunks[self.index]) > 0:
                    flags = self.chunks[self.index][0]
                    is_16 = bool(flags & 0x01)
                    self.pos = 1
            elif take_chars == 0:
                break
        return "".join(parts)

    def skip(self, size):
        self.read(size)


def iter_biff_records(workbook):
    offset = 0
    while offset + 4 <= len(workbook):
        sid, size = struct.unpack_from("<HH", workbook, offset)
        offset += 4
        data = workbook[offset : offset + size]
        offset += size
        yield sid, data, offset - size - 4


def parse_xls(workbook):
    boundsheets = []
    sst_chunks = []
    rows = []
    in_first_sheet = False

    records = list(iter_biff_records(workbook))
    for sid, data, offset in records:
        if sid == 0x0085 and len(data) >= 8:
            sheet_offset = _u32(data, 0)
            name_len = data[6]
            flags = data[7]
            raw = data[8 : 8 + name_len * (2 if flags & 1 else 1)]
            name = raw.decode("utf-16le" if flags & 1 else "cp1251", errors="ignore")
            boundsheets.append((sheet_offset, name))
        elif sid == 0x00FC:
            sst_chunks.append(data[8:])
        elif sid == 0x003C and sst_chunks:
            sst_chunks.append(data)

    shared_strings = []
    if sst_chunks:
        reader = ChunkReader(sst_chunks)
        while True:
            raw_len = reader.read(2)
            if len(raw_len) < 2:
                break
            char_count = _u16(raw_len, 0)
            flag_raw = reader.read(1)
            if len(flag_raw) < 1:
                break
            flags = flag_raw[0]
            rich_runs = _u16(reader.read(2), 0) if flags & 0x08 else 0
            ext_size = _u32(reader.read(4), 0) if flags & 0x04 else 0
            text = reader.read_chars(char_count, bool(flags & 0x01))
            if rich_runs:
                reader.skip(rich_runs * 4)
            if ext_size:
                reader.skip(ext_size)
            shared_strings.append(text)

    first_sheet_offset = boundsheets[0][0] if boundsheets else 0
    cells = {}
    for sid, data, offset in records:
        if offset == first_sheet_offset:
            in_first_sheet = True
        elif in_first_sheet and sid == 0x000A:
            break
        if not in_first_sheet:
            continue

        if sid == 0x00FD and len(data) >= 10:
            row, col = _u16(data, 0), _u16(data, 2)
            sst_index = _u32(data, 6)
            cells[(row, col)] = shared_strings[sst_index] if sst_index < len(shared_strings) else ""
        elif sid == 0x0203 and len(data) >= 14:
            row, col = _u16(data, 0), _u16(data, 2)
            cells[(row, col)] = _f64(data, 6)
        elif sid == 0x027E and len(data) >= 10:
            row, col = _u16(data, 0), _u16(data, 2)
            cells[(row, col)] = decode_rk(_u32(data, 6))
        elif sid == 0x00BD and len(data) >= 6:
            row, first_col = _u16(data, 0), _u16(data, 2)
            count = (len(data) - 6) // 6
            for i in range(count):
                cells[(row, first_col + i)] = decode_rk(_u32(data, 4 + i * 6 + 2))
        elif sid == 0x0204 and len(data) >= 8:
            row, col = _u16(data, 0), _u16(data, 2)
            length = _u16(data, 6)
            raw = data[8 : 8 + length]
            cells[(row, col)] = raw.decode("cp1251", errors="ignore")

    if not cells:
        return []
    max_row = max(r for r, _ in cells)
    max_col = max(c for _, c in cells)
    for r in range(max_row + 1):
        rows.append([cells.get((r, c), "") for c in range(max_col + 1)])
    return rows


def decode_rk(value):
    divided = value & 0x01
    is_integer = value & 0x02
    raw = value & 0xFFFFFFFC
    if is_integer:
        if raw & 0x80000000:
            raw -= 0x100000000
        result = raw >> 2
    else:
        result = struct.unpack("<d", struct.pack("<Q", raw << 32))[0]
    return result / 100 if divided else result


def excel_date(value):
    if not isinstance(value, (int, float)) or value <= 0:
        return str(value or "")[:10]
    return (_dt.datetime(1899, 12, 30) + _dt.timedelta(days=float(value))).date().isoformat()


def to_number(value, default=0):
    try:
        result = float(value)
        return result if math.isfinite(result) else default
    except (TypeError, ValueError):
        return default


def row_value(row, idx, name, default=""):
    i = idx.get(name)
    return row[i] if i is not None and i < len(row) else default


def row_text(row, idx, name, default=""):
    return str(row_value(row, idx, name, default) or "").strip()


def make_stats_from_summary(row, idx, fallback_epics):
    ttm_source = row_value(row, idx, "T2M_p_Dash", row_value(row, idx, "Test T2M", 0))
    ttm = round(to_number(ttm_source))
    p85 = round(to_number(row_value(row, idx, "Group 85% T2M", ttm_source), ttm))
    average_value = round(to_number(row_value(row, idx, "Test T2M", ttm_source), ttm))

    if not ttm and fallback_epics:
        values = [epic["totalTtmDays"] for epic in fallback_epics]
        ttm = round(statistics.median(values))
        p85 = ttm
        average_value = round(statistics.mean(values))

    return {
        "ttm": ttm,
        "p85": p85,
        "average": average_value,
        "target": 90,
        "previousTtm": max(0, round(ttm * 0.94)),
        "discovery": round(to_number(row_value(row, idx, "TTDisc", 0))),
        "delivery": round(to_number(row_value(row, idx, "TTD", 0))),
        "rollout": round(to_number(row_value(row, idx, "TTRollout", 0))),
    }


def normalize_stages(total_ttm, discovery, delivery, rollout):
    total_ttm = round(to_number(total_ttm))
    stage_sum = to_number(discovery) + to_number(delivery) + to_number(rollout)
    if total_ttm <= 0 or stage_sum <= 0:
        return {"discovery": 0, "delivery": 0, "rollout": 0}

    discovery_days = round(total_ttm * to_number(discovery) / stage_sum)
    delivery_days = round(total_ttm * to_number(delivery) / stage_sum)
    rollout_days = round(total_ttm * to_number(rollout) / stage_sum)
    rollout_days += total_ttm - (discovery_days + delivery_days + rollout_days)

    return {
        "discovery": discovery_days,
        "delivery": delivery_days,
        "rollout": rollout_days,
    }


def build_typescript(rows, output_path):
    header = [str(x).strip() for x in rows[0]]
    idx = {name: i for i, name in enumerate(header)}
    required = ["Код", "Тема", "Статус", "T2M_p_Dash", "TTDisc", "TTD", "TTRollout", "TIHold", "Дата резолюции", "Q T2M", "Продукт"]
    missing = [name for name in required if name not in idx]
    if missing:
        raise ValueError(f"В файле не найдены колонки: {', '.join(missing)}")

    stream_names = ["Digital Sales", "Канал АБ", "Коммуникации"]
    stream_ids = {"Digital Sales": "stream-digital-sales", "Канал АБ": "stream-kanal-ab", "Коммуникации": "stream-communications"}
    team_ids = {"Digital Sales": "team-digital-sales", "Канал АБ": "team-kanal-ab", "Коммуникации": "team-communications"}

    quarter_by_row = {}
    direction_summary_by_quarter = {}
    stream_summary_by_quarter = {}
    current_quarter = None
    for row_index, row in enumerate(rows[1:], start=1):
        topic = row_text(row, idx, "Тема")
        code = row_text(row, idx, "Код")
        quarter_match = re.fullmatch(r"2026 Q([1-4])", topic)
        if not code and quarter_match:
            current_quarter = f"Q{quarter_match.group(1)}"
            direction_summary_by_quarter[current_quarter] = row
        elif not code and current_quarter and topic in stream_ids:
            stream_summary_by_quarter.setdefault(current_quarter, {})[topic] = row
        quarter_by_row[row_index] = current_quarter

    selected_quarter = "Q2" if "Q2" in direction_summary_by_quarter else sorted(direction_summary_by_quarter)[-1]

    epics = []
    for row_index, row in enumerate(rows[1:], start=1):
        def val(name, default=""):
            i = idx.get(name)
            return row[i] if i is not None and i < len(row) else default

        key = str(val("Код", "")).strip()
        product = str(val("Продукт", "")).strip()
        if not key or product not in stream_ids:
            continue
        ttm = float(val("T2M_p_Dash", val("Test T2M", 0)) or 0)
        if not math.isfinite(ttm):
            continue
        q = str(val("Q T2M", "Q2")).replace("2026 ", "")
        if q not in {"Q1", "Q2", "Q3", "Q4"}:
            q = quarter_by_row.get(row_index) or selected_quarter
        if q != selected_quarter:
            continue
        epics.append({
            "id": "jira-" + re.sub(r"[^a-zA-Z0-9]+", "-", key).strip("-").lower(),
            "key": key,
            "title": str(val("Тема", "")),
            "streamId": stream_ids[product],
            "teamId": team_ids[product],
            "status": str(val("Статус", "")),
            "totalTtmDays": round(ttm),
            "discoveryDays": round(float(val("TTDisc", 0) or 0)),
            "deliveryDays": round(float(val("TTD", 0) or 0)),
            "rolloutDays": round(float(val("TTRollout", 0) or 0)),
            "rolloutQuarter": q,
            "rolloutCompletedAt": excel_date(val("Дата резолюции", "")),
            "daysInProgress": round(ttm),
            "daysWithoutActivity": round(float(val("TIHold", 0) or 0)),
            "linkedTasks": [],
        })

    teams = [{"id": team_ids[name], "name": name, "streamId": stream_ids[name]} for name in stream_names]
    streams = []
    for name in stream_names:
        stream_epics = [e for e in epics if e["streamId"] == stream_ids[name]]
        summary_row = stream_summary_by_quarter.get(selected_quarter, {}).get(name)
        stats = make_stats_from_summary(summary_row, idx, stream_epics) if summary_row else make_stats_from_summary([], idx, stream_epics)
        raw_stages = {
            "discovery": to_number(row_value(summary_row, idx, "TTDisc", 0)),
            "delivery": to_number(row_value(summary_row, idx, "TTD", 0)),
            "rollout": to_number(row_value(summary_row, idx, "TTRollout", 0)),
        }
        stats.update(normalize_stages(stats["ttm"], raw_stages["discovery"], raw_stages["delivery"], raw_stages["rollout"]))
        stats["ttm"] = stats["discovery"] + stats["delivery"] + stats["rollout"]
        streams.append({
            "id": stream_ids[name],
            "name": name,
            "epicCount": round(to_number(row_value(summary_row, idx, "Кол-во листовых подобъектов", len(stream_epics)))) if summary_row else len(stream_epics),
            **stats,
            "trend": [max(0, stats["ttm"] + 8), max(0, stats["ttm"] + 4), max(0, stats["ttm"] + 2), stats["ttm"]],
            "teams": [t for t in teams if t["streamId"] == stream_ids[name]],
            "epics": stream_epics,
        })
    direction_row = direction_summary_by_quarter.get(selected_quarter)
    direction_stats = make_stats_from_summary(direction_row, idx, epics) if direction_row else make_stats_from_summary([], idx, epics)
    direction_stats.update(
        normalize_stages(
            direction_stats["ttm"],
            to_number(row_value(direction_row, idx, "TTDisc", 0)),
            to_number(row_value(direction_row, idx, "TTD", 0)),
            to_number(row_value(direction_row, idx, "TTRollout", 0)),
        )
    )
    direction = {"id": "direction-jira", "name": "IT-дирекция", **direction_stats, "streams": streams}

    content = 'import type { Direction, Epic, Stream, Team } from "../types";\n\n'
    content += "export const jiraTeams: Team[] = " + json.dumps(teams, ensure_ascii=False, indent=2) + ";\n\n"
    content += "export const jiraEpics: Epic[] = " + json.dumps(epics, ensure_ascii=False, indent=2) + ";\n\n"
    content += "export const jiraStreams: Stream[] = " + json.dumps(streams, ensure_ascii=False, indent=2) + ";\n\n"
    content += "export const jiraDirection: Direction = " + json.dumps(direction, ensure_ascii=False, indent=2) + ";\n"
    Path(output_path).write_text(content, encoding="utf-8")
    return {"epics": len(epics), "streams": [(s["name"], len(s["epics"]), s["ttm"], s["p85"], s["average"]) for s in streams], "direction": {k: direction[k] for k in ("ttm", "p85", "average", "discovery", "delivery", "rollout")}}


if __name__ == "__main__":
    workbook = read_cfb_stream(sys.argv[1])
    rows = parse_xls(workbook)
    summary = build_typescript(rows, sys.argv[2])
    print(json.dumps(summary, ensure_ascii=False, indent=2))
