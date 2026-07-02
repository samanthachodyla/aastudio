import { useState } from "react";
import { Check, Plus, Trash2, ChevronDown, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardTodos() {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos } = useStore();
  const [text, setText] = useState("");
  const [showArchive, setShowArchive] = useState(false);

  const active = todos.filter(t => !t.done);
  const archived = todos.filter(t => t.done);

  const submit = () => {
    if (!text.trim()) return;
    addTodo(text);
    setText("");
  };

  return (
    <section className="mb-12">
      <div className="hairline-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="eyebrow">To-do</div>
        </div>

        {/* Add row */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder="Add a to-do…"
            className="flex-1"
          />
          <Button size="sm" className="gap-2 shrink-0" onClick={submit} disabled={!text.trim()}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {/* Active list */}
        {active.length === 0 ? (
          <div className="px-6 py-8 text-sm text-muted-foreground italic text-center">
            {archived.length > 0 ? "All done — nice. Add another above." : "Nothing yet — add your first to-do."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {active.map(t => (
              <li key={t.id} className="group px-6 py-4 flex items-center gap-4">
                <button
                  onClick={() => toggleTodo(t.id)}
                  aria-label="Mark as done"
                  className="shrink-0 h-5 w-5 rounded-sm border border-muted-foreground/50 text-transparent hover:border-foreground flex items-center justify-center transition-all duration-200"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span className="flex-1 text-[15px] leading-snug">{t.text}</span>
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

        {/* Archive — completed items land here automatically */}
        {archived.length > 0 && (
          <div className="border-t border-border">
            <div className="px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => setShowArchive(v => !v)}
                className="flex items-center gap-2 eyebrow hover:text-foreground transition-colors"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showArchive ? "rotate-180" : ""}`} />
                Archive · {archived.length}
              </button>
              <button
                onClick={clearCompletedTodos}
                className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear archive
              </button>
            </div>
            {showArchive && (
              <ul className="divide-y divide-border border-t border-border">
                {archived.map(t => (
                  <li key={t.id} className="group px-6 py-3 flex items-center gap-4">
                    <button
                      onClick={() => toggleTodo(t.id)}
                      aria-label="Restore to active"
                      title="Restore"
                      className="shrink-0 h-5 w-5 rounded-sm border bg-foreground border-foreground text-background flex items-center justify-center transition-all duration-200"
                    >
                      <Check className="h-3.5 w-3.5 group-hover:hidden" strokeWidth={2.5} />
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
