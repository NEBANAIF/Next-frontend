/** Local calendar date as yyyy-MM-dd (avoid UTC drift from toISOString()). */
export function localYMD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYMD(s) {
  if (!s) return null;
  const str = String(s);
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function addDaysYMD(ymd, deltaDays) {
  const d = parseYMD(ymd);
  if (!d) return localYMD();
  d.setDate(d.getDate() + deltaDays);
  return localYMD(d);
}

export function startOfMonthYMD(d = new Date()) {
  return localYMD(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function startOfQuarterYMD(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3);
  return localYMD(new Date(d.getFullYear(), q * 3, 1));
}

export function startOfYearYMD(d = new Date()) {
  return localYMD(new Date(d.getFullYear(), 0, 1));
}

/** Normalize API LocalDate (string or array [y,m,d]) to yyyy-MM-dd */
export function normalizeSaleDate(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.length >= 10 ? v.slice(0, 10) : v;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v);
}
