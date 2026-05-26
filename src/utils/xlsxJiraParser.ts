import type { Direction, Epic, Stream, Team } from "../types";

type ZipEntry = {
  compression: number;
  compressedSize: number;
  fileName: string;
  localHeaderOffset: number;
  uncompressedSize: number;
};

const streamNames = ["Digital Sales", "Канал АБ", "Коммуникации"];
const streamIds: Record<string, string> = {
  "Digital Sales": "stream-digital-sales",
  "Канал АБ": "stream-kanal-ab",
  "Коммуникации": "stream-communications",
};
const teamIds: Record<string, string> = {
  "Digital Sales": "team-digital-sales",
  "Канал АБ": "team-kanal-ab",
  "Коммуникации": "team-communications",
};

const textDecoder = new TextDecoder("utf-8");

const readU16 = (view: DataView, offset: number) => view.getUint16(offset, true);
const readU32 = (view: DataView, offset: number) => view.getUint32(offset, true);

const escapeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

const excelSerialToDate = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "";
  const utcDays = Math.floor(value - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
};

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const k = (sorted.length - 1) * p;
  const floor = Math.floor(k);
  const ceil = Math.ceil(k);
  if (floor === ceil) return sorted[floor];
  return sorted[floor] * (ceil - k) + sorted[ceil] * (k - floor);
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  return percentile(values, 0.5);
};

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const aggregate = (epics: Epic[]) => {
  const ttmValues = epics.map((epic) => epic.totalTtmDays);
  const ttm = Math.round(median(ttmValues));

  return {
    ttm,
    p85: Math.round(percentile(ttmValues, 0.85)),
    average: Math.round(average(ttmValues)),
    target: 90,
    previousTtm: Math.max(0, Math.round(ttm * 0.94)),
    discovery: Math.round(average(epics.map((epic) => epic.discoveryDays))),
    delivery: Math.round(average(epics.map((epic) => epic.deliveryDays))),
    rollout: Math.round(average(epics.map((epic) => epic.rolloutDays))),
  };
};

const normalizeQuarter = (value: unknown) => {
  const text = String(value ?? "").replace("2026 ", "").trim();
  return ["Q1", "Q2", "Q3", "Q4"].includes(text) ? (text as Epic["rolloutQuarter"]) : undefined;
};

const statsFromSummary = (row: unknown[] | undefined, getIndex: (name: string, fallback: number) => number, fallbackEpics: Epic[]) => {
  const ttmIndex = getIndex("T2M_p_Dash", 6);
  const fallbackTtmIndex = getIndex("Test T2M", 3);
  const p85Index = getIndex("Group 85% T2M", -1);
  const discoveryIndex = getIndex("TTDisc", 16);
  const deliveryIndex = getIndex("TTD", 17);
  const rolloutIndex = getIndex("TTRollout", 18);

  if (!row) return aggregate(fallbackEpics);

  const sourceTtm = toNumber(row[ttmIndex] ?? row[fallbackTtmIndex]);
  const ttm = Math.round(sourceTtm);

  return {
    ttm,
    p85: Math.round(toNumber(p85Index >= 0 ? row[p85Index] : sourceTtm) || ttm),
    average: Math.round(toNumber(row[fallbackTtmIndex]) || ttm),
    target: 90,
    previousTtm: Math.max(0, Math.round(ttm * 0.94)),
    discovery: Math.round(toNumber(row[discoveryIndex])),
    delivery: Math.round(toNumber(row[deliveryIndex])),
    rollout: Math.round(toNumber(row[rolloutIndex])),
  };
};

const normalizeStages = (totalTTM: number, discovery: number, delivery: number, rollout: number) => {
  const sum = discovery + delivery + rollout;
  if (totalTTM <= 0 || sum <= 0) {
    return {
      discovery: 0,
      delivery: 0,
      rollout: 0,
    };
  }

  const discoveryDays = Math.round((totalTTM * discovery) / sum);
  const deliveryDays = Math.round((totalTTM * delivery) / sum);
  let rolloutDays = Math.round((totalTTM * rollout) / sum);

  rolloutDays += totalTTM - (discoveryDays + deliveryDays + rolloutDays);

  return {
    discovery: discoveryDays,
    delivery: deliveryDays,
    rollout: rolloutDays,
  };
};

const findEndOfCentralDirectory = (view: DataView) => {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) return offset;
  }
  throw new Error("Не удалось прочитать структуру .xlsx файла.");
};

const readZipEntries = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = readU16(view, eocdOffset + 10);
  const centralDirectoryOffset = readU32(view, eocdOffset + 16);
  const entries = new Map<string, ZipEntry>();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (readU32(view, offset) !== 0x02014b50) break;

    const compression = readU16(view, offset + 10);
    const compressedSize = readU32(view, offset + 20);
    const uncompressedSize = readU32(view, offset + 24);
    const fileNameLength = readU16(view, offset + 28);
    const extraLength = readU16(view, offset + 30);
    const commentLength = readU16(view, offset + 32);
    const localHeaderOffset = readU32(view, offset + 42);
    const fileName = textDecoder.decode(new Uint8Array(buffer, offset + 46, fileNameLength));

    entries.set(fileName, { compression, compressedSize, fileName, localHeaderOffset, uncompressedSize });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
};

const readZipText = async (buffer: ArrayBuffer, entries: Map<string, ZipEntry>, fileName: string) => {
  const entry = entries.get(fileName);
  if (!entry) return "";

  const view = new DataView(buffer);
  const localOffset = entry.localHeaderOffset;
  const fileNameLength = readU16(view, localOffset + 26);
  const extraLength = readU16(view, localOffset + 28);
  const dataOffset = localOffset + 30 + fileNameLength + extraLength;
  const compressed = buffer.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compression === 0) {
    return textDecoder.decode(compressed);
  }

  if (entry.compression !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("Этот .xlsx использует сжатие, которое браузер не смог распаковать.");
  }

  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const decompressed = await new Response(stream).arrayBuffer();

  if (entry.uncompressedSize && decompressed.byteLength !== entry.uncompressedSize) {
    return textDecoder.decode(decompressed);
  }

  return textDecoder.decode(decompressed);
};

const parseSharedStrings = (xml: string) => {
  if (!xml) return [];
  const document = new DOMParser().parseFromString(xml, "application/xml");

  return Array.from(document.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t"))
      .map((node) => node.textContent ?? "")
      .join(""),
  );
};

const columnIndex = (cellRef: string) => {
  const letters = cellRef.match(/[A-Z]+/)?.[0] ?? "";
  return [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const cellValue = (cell: Element, sharedStrings: string[]) => {
  const type = cell.getAttribute("t");

  if (type === "inlineStr") {
    return Array.from(cell.getElementsByTagName("t"))
      .map((node) => node.textContent ?? "")
      .join("");
  }

  const raw = cell.getElementsByTagName("v")[0]?.textContent ?? "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "str") return raw;

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : raw;
};

const parseSheetRows = (xml: string, sharedStrings: string[]) => {
  const document = new DOMParser().parseFromString(xml, "application/xml");

  return Array.from(document.getElementsByTagName("row")).map((row) => {
    const values: unknown[] = [];

    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      values[columnIndex(cell.getAttribute("r") ?? "")] = cellValue(cell, sharedStrings);
    });

    return values;
  });
};

const findSheetPath = async (buffer: ArrayBuffer, entries: Map<string, ZipEntry>) => {
  const workbookXml = await readZipText(buffer, entries, "xl/workbook.xml");
  const workbookRels = await readZipText(buffer, entries, "xl/_rels/workbook.xml.rels");
  const workbook = new DOMParser().parseFromString(workbookXml, "application/xml");
  const firstSheet = workbook.getElementsByTagName("sheet")[0];
  const relationId = firstSheet?.getAttribute("r:id");

  if (!relationId) return "xl/worksheets/sheet1.xml";

  const rels = new DOMParser().parseFromString(workbookRels, "application/xml");
  const relation = Array.from(rels.getElementsByTagName("Relationship")).find((item) => item.getAttribute("Id") === relationId);
  const target = relation?.getAttribute("Target") ?? "worksheets/sheet1.xml";

  return target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^xl\//, "")}`;
};

const findSheetPaths = async (buffer: ArrayBuffer, entries: Map<string, ZipEntry>) => {
  const workbookXml = await readZipText(buffer, entries, "xl/workbook.xml");
  const workbookRels = await readZipText(buffer, entries, "xl/_rels/workbook.xml.rels");
  const workbook = new DOMParser().parseFromString(workbookXml, "application/xml");
  const rels = new DOMParser().parseFromString(workbookRels, "application/xml");
  const relations = new Map(
    Array.from(rels.getElementsByTagName("Relationship")).map((item) => [
      item.getAttribute("Id") ?? "",
      item.getAttribute("Target") ?? "",
    ]),
  );

  const paths = Array.from(workbook.getElementsByTagName("sheet")).flatMap((sheet) => {
    const relationId = sheet.getAttribute("r:id");
    const target = relationId ? relations.get(relationId) : undefined;
    if (!target) return [];
    return [target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^xl\//, "")}`];
  });

  return paths.length ? paths : [await findSheetPath(buffer, entries)];
};

const hasJiraHeaders = (rows: unknown[][]) => {
  const header = rows[0]?.map((value) => String(value ?? "").trim()) ?? [];
  return ["Код", "Тема", "Продукт", "T2M_p_Dash"].every((name) => header.includes(name));
};

const rowsFromHeader = (rows: unknown[][]) => {
  const headerIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value ?? "").trim());
    return ["Код", "Тема", "Продукт", "T2M_p_Dash"].every((name) => header.includes(name));
  });

  return headerIndex >= 0 ? rows.slice(headerIndex) : rows;
};

export const buildDashboardFromJiraRows = (rows: unknown[][]) => {
  const header = rows[0].map((value) => String(value ?? "").trim());
  const indexByName = new Map(header.map((name, index) => [name, index]));
  const getIndex = (name: string, fallback: number) => indexByName.get(name) ?? fallback;

  const codeIndex = getIndex("Код", 0);
  const titleIndex = getIndex("Тема", 2);
  const statusIndex = getIndex("Статус", 5);
  const ttmIndex = getIndex("T2M_p_Dash", 6);
  const fallbackTtmIndex = getIndex("Test T2M", 3);
  const discoveryIndex = getIndex("TTDisc", 16);
  const deliveryIndex = getIndex("TTD", 17);
  const rolloutIndex = getIndex("TTRollout", 18);
  const idleIndex = getIndex("TIHold", 20);
  const resolutionIndex = getIndex("Дата резолюции", 31);
  const quarterIndex = getIndex("Q T2M", 32);
  const productIndex = getIndex("Продукт", 36);

  const quarterByRow = new Map<number, Epic["rolloutQuarter"]>();
  const directionSummaryByQuarter = new Map<Epic["rolloutQuarter"], unknown[]>();
  const streamSummaryByQuarter = new Map<Epic["rolloutQuarter"], Map<string, unknown[]>>();
  let currentQuarter: Epic["rolloutQuarter"] | undefined;

  rows.slice(1).forEach((row, relativeIndex) => {
    const rowIndex = relativeIndex + 1;
    const key = String(row[codeIndex] ?? "").trim();
    const topic = String(row[titleIndex] ?? "").trim();
    const quarterMatch = /^2026 Q([1-4])$/.exec(topic);

    if (!key && quarterMatch) {
      currentQuarter = `Q${quarterMatch[1]}` as Epic["rolloutQuarter"];
      directionSummaryByQuarter.set(currentQuarter, row);
    } else if (!key && currentQuarter && streamIds[topic]) {
      if (!streamSummaryByQuarter.has(currentQuarter)) {
        streamSummaryByQuarter.set(currentQuarter, new Map());
      }
      streamSummaryByQuarter.get(currentQuarter)?.set(topic, row);
    }

    if (currentQuarter) quarterByRow.set(rowIndex, currentQuarter);
  });

  const selectedQuarter =
    directionSummaryByQuarter.has("Q2") ? "Q2" : Array.from(directionSummaryByQuarter.keys()).sort().at(-1) ?? "Q2";

  const epics: Epic[] = rows.slice(1).flatMap((row, relativeIndex) => {
    const rowIndex = relativeIndex + 1;
    const key = String(row[codeIndex] ?? "").trim();
    const product = String(row[productIndex] ?? "").trim();
    const ttm = toNumber(row[ttmIndex] ?? row[fallbackTtmIndex]);

    if (!key || !streamIds[product]) return [];

    const rolloutQuarter = normalizeQuarter(row[quarterIndex]) ?? quarterByRow.get(rowIndex) ?? selectedQuarter;
    if (rolloutQuarter !== selectedQuarter) return [];
    const resolution = row[resolutionIndex];
    const resolutionDate = typeof resolution === "number" ? excelSerialToDate(resolution) : String(resolution ?? "").slice(0, 10);

    return [
      {
        id: `jira-${escapeId(key)}`,
        key,
        title: String(row[titleIndex] ?? ""),
        streamId: streamIds[product],
        teamId: teamIds[product],
        status: String(row[statusIndex] ?? ""),
        totalTtmDays: Math.round(ttm),
        discoveryDays: Math.round(toNumber(row[discoveryIndex])),
        deliveryDays: Math.round(toNumber(row[deliveryIndex])),
        rolloutDays: Math.round(toNumber(row[rolloutIndex])),
        rolloutQuarter: rolloutQuarter as Epic["rolloutQuarter"],
        rolloutCompletedAt: resolutionDate,
        daysInProgress: Math.round(ttm),
        daysWithoutActivity: Math.round(toNumber(row[idleIndex])),
        linkedTasks: [],
      },
    ];
  });

  const teams: Team[] = streamNames.map((name) => ({
    id: teamIds[name],
    name,
    streamId: streamIds[name],
  }));

  const streams: Stream[] = streamNames.map((name) => {
    const streamEpics = epics.filter((epic) => epic.streamId === streamIds[name]);
    const summaryRow = streamSummaryByQuarter.get(selectedQuarter)?.get(name);
    const baseStats = statsFromSummary(summaryRow, getIndex, streamEpics);
    const normalizedStages = normalizeStages(
      baseStats.ttm,
      toNumber(summaryRow?.[discoveryIndex]),
      toNumber(summaryRow?.[deliveryIndex]),
      toNumber(summaryRow?.[rolloutIndex]),
    );
    const stats = {
      ...baseStats,
      ...normalizedStages,
    };
    stats.ttm = stats.discovery + stats.delivery + stats.rollout;

    return {
      id: streamIds[name],
      name,
      epicCount: Math.round(toNumber(streamSummaryByQuarter.get(selectedQuarter)?.get(name)?.[getIndex("Кол-во листовых подобъектов", 1)]) || streamEpics.length),
      ...stats,
      trend: [Math.max(0, stats.ttm + 8), Math.max(0, stats.ttm + 4), Math.max(0, stats.ttm + 2), stats.ttm],
      teams: teams.filter((team) => team.streamId === streamIds[name]),
      epics: streamEpics,
    };
  });
  const directionBaseStats = statsFromSummary(directionSummaryByQuarter.get(selectedQuarter), getIndex, epics);
  const directionNormalizedStages = normalizeStages(
    directionBaseStats.ttm,
    toNumber(directionSummaryByQuarter.get(selectedQuarter)?.[discoveryIndex]),
    toNumber(directionSummaryByQuarter.get(selectedQuarter)?.[deliveryIndex]),
    toNumber(directionSummaryByQuarter.get(selectedQuarter)?.[rolloutIndex]),
  );

  const direction: Direction = {
    id: "direction-jira-upload",
    name: "IT-дирекция",
    ...directionBaseStats,
    ...directionNormalizedStages,
    streams,
  };

  return { direction, streams, teams, epics };
};

export const parseJiraWorkbook = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const entries = readZipEntries(buffer);
  const sharedStrings = parseSharedStrings(await readZipText(buffer, entries, "xl/sharedStrings.xml"));
  const sheetPaths = await findSheetPaths(buffer, entries);

  for (const sheetPath of sheetPaths) {
    const sheetXml = await readZipText(buffer, entries, sheetPath);
    const rows = rowsFromHeader(parseSheetRows(sheetXml, sharedStrings));
    if (!hasJiraHeaders(rows)) continue;

    const dashboard = buildDashboardFromJiraRows(rows);
    if (dashboard.direction.ttm > 0 || dashboard.epics.length > 0) return dashboard;
  }

  throw new Error("В файле не найден лист с TTM-таблицей Jira. Проверь, что в выгрузке есть колонки Код, Тема, Продукт и T2M_p_Dash.");
};
