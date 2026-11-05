const DAY_MS = 24 * 60 * 60 * 1000;

const isValidDate = (value) => value instanceof Date && Number.isFinite(value.getTime());

// Calendar selections are local dates, not UTC instants.
export function formatLocalDate(value) {
  if (!isValidDate(value)) return null;
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function inclusiveCalendarDays(start, end) {
  if (!isValidDate(start) || !isValidDate(end)) return 0;
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  if (endDay < startDay) return 0;
  return Math.round((endDay - startDay) / DAY_MS) + 1;
}
