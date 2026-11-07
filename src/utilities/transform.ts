//this file is a safeguard and normalizer for Timstamps , Symbols (basically Tier types)


import type { RawRow, LatestRow } from '../tier types';

function normalizeToISO(dt: string): string {
  
  const m = dt.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/);
  if (!m) return dt;
  const ms = (m[3] ?? '').padEnd(3, '0').slice(0, 3);
  return `${m[1]}T${m[2]}${ms ? '.' + ms : ''}Z`;
}

function toTimestamp(dt?: string): number {
  if (!dt) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(normalizeToISO(dt));
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

export function latestBySymbolSource(rows: RawRow[]): LatestRow[] {
  const map = new Map<string, LatestRow & { _ts: number }>();

  for (const r of rows) {
    if (!r?.symbol || !r?.source) continue;
    const key = `${r.symbol}__${r.source}`;
    const ts = toTimestamp(r.datetime);
    const prev = map.get(key);

    if (!prev || ts > prev._ts) {
      const fees = r.fees && typeof r.fees === 'object' ? (r.fees as LatestRow['fees']) : undefined;
      map.set(key, { source: r.source, symbol: r.symbol, datetime: r.datetime, fees, _ts: ts });
    }
  }

  return Array.from(map.values()).map(v => ({
    source: v.source,
    symbol: v.symbol,
    datetime: v.datetime,
    fees: v.fees,
  }));
}