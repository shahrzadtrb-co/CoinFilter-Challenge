//this file is basically for keeping the UI's formate clean 
//some safe guards to handle the string matching , date formating , filling the misssing formates 
// Boring Boring Boring

//missing Value replacement
export const EM_DASH = '—';

//converts unknown value to number
export function ConvToNum(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

//formate numbers to decimals with max 6 digits o returns __ if missing 
export function formatNumber(v: unknown, maxFrac = 6, dash = EM_DASH): string {
  const n = ConvToNum(v);
  if (n === undefined) return dash;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFrac }).format(n);
}

//formats date strings if the parsing doesn't work 
export function formateDate(dt?: string, dash = EM_DASH, locale?: string): string {
  if (!dt) return dash;
  const iso = normalizeToISO(dt);
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return dt; 
  return new Date(t).toLocaleString(locale);
}

// Local normalizer for date
function normalizeToISO(dt: string): string {
  const m = dt.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/);
  if (!m) return dt;
  const ms = (m[3] ?? '').padEnd(3, '0').slice(0, 3);
  return `${m[1]}T${m[2]}${ms ? '.' + ms : ''}Z`;
}