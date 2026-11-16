/**
 * Format a subscription end_date (date-only string from MySQL like "2026-12-07")
 * into a clear, unambiguous format: "Dec 7, 2026"
 *
 * Why: new Date("2026-12-07") parses as UTC midnight which can show the wrong
 * day in non-UTC timezones. We force local midnight with T00:00:00.
 */
export function formatSubDate(dateVal) {
  if (!dateVal) return '—';
  const d = new Date(String(dateVal).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default formatSubDate;
