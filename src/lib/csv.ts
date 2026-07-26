// Shared CSV helpers used by the inventory import and the contacts export.

/**
 * Minimal CSV parser: handles quoted fields, escaped quotes (""), and
 * commas/newlines inside quotes. Returns rows of string cells. Fully-empty
 * rows are dropped.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const t = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell); cell = "";
    } else if (ch === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

/** Escape a single cell for CSV output. */
export function csvCell(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

/** Build a CSV string from a header row + data rows. */
export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map(r => r.map(csvCell).join(",")).join("\n");
}

/** Trigger a browser download of the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
