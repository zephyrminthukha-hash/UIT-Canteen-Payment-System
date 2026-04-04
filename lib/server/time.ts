export function getMonthKeys(monthCount: number, now = new Date()) {
  const keys: string[] = [];
  const normalized = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const start = new Date(normalized);
  start.setUTCMonth(normalized.getUTCMonth() - (monthCount - 1));

  for (let i = 0; i < monthCount; i += 1) {
    const current = new Date(start);
    current.setUTCMonth(start.getUTCMonth() + i);
    const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }

  return keys;
}

export function monthKeyFromDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonthUtc(monthOffsetFromCurrent = 0, now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffsetFromCurrent, 1, 0, 0, 0, 0));
}

export function parseDateOrUndefined(value: string | null) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}
