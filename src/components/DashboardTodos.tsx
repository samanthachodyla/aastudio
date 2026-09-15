import { useState, useMemo } from "react";
import { Check, Plus, Trash2, ChevronDown, RotateCcw, Flag, Repeat, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Todo, TodoPriority, TodoRecurrence } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseQuickAdd, dueMeta } from "@/lib/todoParse";

// Todoist-style priority colors (1 = highest).
const PRIORITY_COLOR: Record<TodoPriority, string> = {
  1: "#d1453b", // red
  2: "#eb8909", // amber
  3: "#246fe0", // blue
  4: "", // none — muted border only
};
const prColor = (p?: TodoPriority) => (p && p !== 4 ? PRIORITY_COLOR[p] : "");

// Sections shown top-to-bottom; each only appears when it has tasks.
const SECTION_ORDER = ["overdue", "today", "tomorrow", "upcoming", "none"] as const;
type Section = typeof SECTION_ORDER[number];
const SECTION_LABEL: Record<Section, string> = {
  overdue: "Overdue", today: "Today", tomorrow: "Tomorrow", upcoming: "Upcoming", none: "No date",
};

export function DashboardTodos() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompletedTodos } = useStore();
  const [text, setText] = useState("");
  const [showArchive, setShowArchive] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    addTodo(parseQuickAdd(text));
    setText("");
  };

  const active = todos.filter((t) => !t.done);
  const archived = todos.filter((t) => t.done);

  // Group active tasks into date sections, sorted by priority then due date.
  const sections = useMemo(() => {
    const byBucket: Record<Section, Todo[]> = { overdue: [], today: [], tomorrow: [], upcoming: [], none: [] };
    for (const t of active) byBucket[dueMeta(t.due).bucket].push(t);
    const pr = (t: Todo) => t.priority ?? 4;
    for (const key of SECTION_ORDER) {
      byBucket[key].sort((a, b) =>
        pr(a) - pr(b) ||
        (a.due || "9999").localeCompare(b.due || "9999") ||
        a.createdAt.localeCompare(b.createdAt)
      );
    }
    return SECTION_ORDER.map((key) => ({ key, label: SECTION_LABEL[key], items: byBucket[key] })).filter((s) => s.items.length);
  }, [active]);

  const cyclePriority = (t: Todo) => {
    const order: (TodoPriority | undefined)[] = [1, 2, 3, undefined];
    const i = order.findIndex((o) => o === (t.priority && t.priority !== 4 ? t.priority : undefined));
    updateTodo(t.id, { priority: order[(i + 1) % order.length] });
  };
  const cycleRecurrence = (t: Todo) => {
    const order: (TodoRecurrence | undefined)[] = ["daily", "weekly", "monthly", undefined];
    const i = order.findIndex((o) => o === t.recurrence);
    updateTodo(t.id, { recurrence: order[(i + 1) % order.length] });
  };

  const TaskRow = ({ t }: { t: Todo }) => {
    const color = prColor(t.priority);
    const meta = dueMeta(t.due);
    return (
      <li className="group px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => toggleTodo(t.id)}
          aria-label="Mark as done"
          title={t.recurrence ? "Complete & reschedule" : "Mark as done"}
          className="shrink-0 h-5 w-5 rounded-full border text-transparent hover:text-current flex items-center justify-center transition-all duration-200"
          style={{ borderColor: color || undefined, color: color || undefined }}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </button>

        <span className="flex-1 text-[15px] leading-snug">{t.text}</span>

        {/* Due date — the whole chip opens a native date picker; ✕ clears it. */}
        <label
          className={`relative shrink-0 inline-flex items-center gap-1 text-[11px] rounded-sm px-1.5 py-1 cursor-pointer border transition-colors ${
            meta.bucket === "overdue"
              ? "text-destructive border-destructive/40"
              : meta.bucket === "today"
              ? "text-primary border-primary/40"
              : t.due
              ? "text-muted-foreground border-border"
              : "text-muted-foreground/60 border-transparent hover:border-border opacity-0 group-hover:opacity-100"
          }`}
          title="Set due date"
        >
          <Calendar className="h-3 w-3" />
          {meta.label || "Date"}
          <input
            type="date"
            value={t.due || ""}
            onChange={(e) => updateTodo(t.id, { due: e.target.value || undefined })}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        {t.due && (
          <button onClick={() => updateTodo(t.id, { due: undefined })} aria-label="Clear date"
            className="shrink-0 -ml-1 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
        )}

        {/* Recurrence toggle */}
        <button
          onClick={() => cycleRecurrence(t)}
          aria-label="Repeat"
          title={t.recurrence ? `Repeats ${t.recurrence}` : "Set repeat"}
          className={`shrink-0 transition-opacity ${t.recurrence ? "text-primary" : "text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-foreground"}`}
        >
          <Repeat className="h-3.5 w-3.5" />
        </button>

        {/* Priority flag */}
        <button
          onClick={() => cyclePriority(t)}
          aria-label="Priority"
          title={t.priority && t.priority !== 4 ? `Priority ${t.priority}` : "Set priority"}
          className={`shrink-0 transition-opacity ${color ? "" : "text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-foreground"}`}
          style={{ color: color || undefined }}
        >
          <Flag className="h-3.5 w-3.5" fill={color || "none"} />
        </button>

        <button
          onClick={() => deleteTodo(t.id)}
          aria-label="Delete to-do"
          className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  };

  return (
    <section className="mb-12">
      <div className="hairline-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="eyebrow">To-do</div>
        </div>

        {/* Add row */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="Add a task — e.g. “Email the gallery tomorrow !1”"
              className="flex-1"
            />
            <Button size="sm" className="gap-2 shrink-0" onClick={submit} disabled={!text.trim()}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Type a date (<span className="font-medium">today</span>, <span className="font-medium">tomorrow</span>, <span className="font-medium">friday</span>, <span className="font-medium">in 3 days</span>), a priority (<span className="font-medium">!1</span>–<span className="font-medium">!4</span>), or a repeat (<span className="font-medium">every week</span>).
          </div>
        </div>

        {/* Active list, grouped by date section */}
        {active.length === 0 ? (
          <div className="px-6 py-8 text-sm text-muted-foreground italic text-center">
            {archived.length > 0 ? "All done — nice. Add another above." : "Nothing yet — add your first task."}
          </div>
        ) : (
          <div>
            {sections.map((s) => (
              <div key={s.key} className="border-b border-border last:border-b-0">
                <div className="px-6 pt-4 pb-1 flex items-center gap-2">
                  <span className={`eyebrow ${s.key === "overdue" ? "text-destructive" : s.key === "today" ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">{s.items.length}</span>
                </div>
                <ul className="divide-y divide-border/60">
                  {s.items.map((t) => <TaskRow key={t.id} t={t} />)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Archive — completed items land here automatically */}
        {archived.length > 0 && (
          <div className="border-t border-border">
            <div className="px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => setShowArchive((v) => !v)}
                className="flex items-center gap-2 eyebrow hover:text-foreground transition-colors"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showArchive ? "rotate-180" : ""}`} />
                Completed · {archived.length}
              </button>
              <button
                onClick={clearCompletedTodos}
                className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            </div>
            {showArchive && (
              <ul className="divide-y divide-border border-t border-border">
                {archived.map((t) => (
                  <li key={t.id} className="group px-6 py-3 flex items-center gap-4">
                    <button
                      onClick={() => toggleTodo(t.id)}
                      aria-label="Restore to active"
                      title="Restore"
                      className="shrink-0 h-5 w-5 rounded-full border bg-foreground border-foreground text-background flex items-center justify-center transition-all duration-200"
                    >
                      <Check className="h-3 w-3 group-hover:hidden" strokeWidth={3} />
                      <RotateCcw className="h-3 w-3 hidden group-hover:block" strokeWidth={2.5} />
                    </button>
                    <span className="flex-1 text-sm leading-snug line-through text-muted-foreground opacity-70">{t.text}</span>
                    <button
                      onClick={() => deleteTodo(t.id)}
                      aria-label="Delete to-do"
                      className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
