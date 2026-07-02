import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardTodos() {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompletedTodos } = useStore();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addTodo(text);
    setText("");
  };

  const completedCount = todos.filter(t => t.done).length;

  return (
    <section className="mb-12">
      <div className="hairline-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="eyebrow">To-do</div>
          {completedCount > 0 && (
            <button
              onClick={clearCompletedTodos}
              className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear completed
            </button>
          )}
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

        {todos.length === 0 ? (
          <div className="px-6 py-8 text-sm text-muted-foreground italic text-center">
            Nothing yet — add your first to-do.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {todos.map(t => (
              <li key={t.id} className="group px-6 py-4 flex items-center gap-4">
                <button
                  onClick={() => toggleTodo(t.id)}
                  aria-pressed={t.done}
                  aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  className={`shrink-0 h-5 w-5 rounded-sm border flex items-center justify-center transition-all duration-200 ${
                    t.done
                      ? "bg-foreground border-foreground text-background animate-check-pop"
                      : "border-muted-foreground/50 text-transparent hover:border-foreground"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span
                  className={`flex-1 text-[15px] leading-snug transition-all duration-300 ${
                    t.done ? "line-through text-muted-foreground opacity-60" : ""
                  }`}
                >
                  {t.text}
                </span>
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
    </section>
  );
}
