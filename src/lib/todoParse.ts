// ============================================================================
// Todoist-style quick-add parsing + date helpers for the dashboard to-do list.
//
// Lets the artist type a task in one line and have priority, due date and
// recurrence pulled out of it — e.g. "Email the gallery tomorrow !1" or
// "Water studio plants every week". Everything is optional; plain text still
// just makes a plain task. Dates are local YYYY-MM-DD strings to avoid timezone
// drift.
// ============================================================================
import type { TodoPriority, TodoRecurrence } from "@/lib/types";

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayStr(): string {
  return toLocalISO(new Date());
}
export function addDaysStr(base: string, n: number): string {
  const d = fromISO(base);
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, weds: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};

/** The next date (today counts) that lands on the given weekday index. */
function nextWeekday(idx: number): string {
  const today = new Date();
  const delta = (idx - today.getDay() + 7) % 7; // 0 = today
  return addDaysStr(todayStr(), delta);
}

/** The next due date for a recurring task after it's completed. Advances from
 *  the later of its current due date or today, so it never lands in the past. */
export function nextRecurrence(due: string | undefined, rec: TodoRecurrence): string {
  const today = todayStr();
  const d = fromISO(due && due > today ? due : today);
  if (rec === "daily") d.setDate(d.getDate() + 1);
  else if (rec === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return toLocalISO(d);
}

export interface ParsedTodo {
  text: string;
  due?: string;
  priority?: TodoPriority;
  recurrence?: TodoRecurrence;
}

/** Pull priority (!1–!4 / p1–p4), recurrence (daily/weekly/monthly, "every …")
 *  and a due date (today, tomorrow, weekday names, "in N days", "next week")
 *  out of a free-text task line. */
export function parseQuickAdd(raw: string): ParsedTodo {
  let text = ` ${raw.trim()} `;
  let priority: TodoPriority | undefined;
  let due: string | undefined;
  let recurrence: TodoRecurrence | undefined;
  const today = todayStr();

  const strip = (re: RegExp) => { const m = text.match(re); if (m) { text = text.replace(m[0], " "); return m; } return null; };

  const pm = strip(/\s(?:!|p)([1-4])\b/i);
  if (pm) priority = Number(pm[1]) as TodoPriority;

  const rm = strip(/\s(?:every\s+(day|week|month)|daily|weekly|monthly)\b/i);
  if (rm) {
    const w = rm[0].toLowerCase();
    recurrence = /day|daily/.test(w) ? "daily" : /week/.test(w) ? "weekly" : "monthly";
  }

  const inDays = strip(/\sin\s+(\d+)\s+days?\b/i);
  if (inDays) due = addDaysStr(today, parseInt(inDays[1], 10));
  if (!due && strip(/\stoday\b/i)) due = today;
  if (!due && strip(/\s(?:tomorrow|tmrw|tom)\b/i)) due = addDaysStr(today, 1);
  if (!due && strip(/\snext\s+week\b/i)) due = addDaysStr(today, 7);
  if (!due) {
    const wm = strip(/\s(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b/i);
    if (wm) due = nextWeekday(WEEKDAYS[wm[1].toLowerCase()]);
  }

  // A recurring task with no explicit date starts today.
  if (recurrence && !due) due = today;

  text = text.replace(/\s+/g, " ").trim();
  return { text, due, priority, recurrence };
}

/** A friendly label + urgency bucket for a due date. */
export function dueMeta(due: string | undefined): { label: string; bucket: "overdue" | "today" | "tomorrow" | "upcoming" | "none" } {
  if (!due) return { label: "", bucket: "none" };
  const today = todayStr();
  const tomorrow = addDaysStr(today, 1);
  if (due < today) return { label: relLabel(due), bucket: "overdue" };
  if (due === today) return { label: "Today", bucket: "today" };
  if (due === tomorrow) return { label: "Tomorrow", bucket: "tomorrow" };
  return { label: relLabel(due), bucket: "upcoming" };
}

function relLabel(due: string): string {
  const d = fromISO(due);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
