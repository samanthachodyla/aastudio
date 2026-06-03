import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { StudioManagerChat } from "./StudioManagerChat";

export function StudioManagerBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-3rem))] h-[min(560px,calc(100vh-8rem))] bg-background border border-border shadow-2xl rounded-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
            <div>
              <div className="eyebrow">Live</div>
              <div className="font-display text-base leading-tight">Studio Manager</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <StudioManagerChat />
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background shadow-xl hover:scale-105 transition-transform flex items-center justify-center"
        aria-label={open ? "Close Studio Manager chat" : "Open Studio Manager chat"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
