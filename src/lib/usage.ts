// Lightweight engagement tracking. Writes to usage_events; user_id is filled by
// the column's `default auth.uid()`, so we never send it from the client.
// Analytics must never break the app, so all failures are swallowed.
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const db = supabase as unknown as { from: (t: string) => any };

// One id per tab load, so we can distinguish sessions in reports.
const SESSION_ID = Math.random().toString(36).slice(2, 12);
const HEARTBEAT_MS = 60_000; // ~1 min of "active time" per heartbeat

async function logEvent(eventType: string, path: string) {
  try {
    await db.from("usage_events").insert({ event_type: eventType, path, session_id: SESSION_ID });
  } catch {
    /* ignore — analytics is best-effort */
  }
}

/**
 * Mounted once inside the authenticated app. Logs a page_view on every route
 * change, a heartbeat each minute the tab is visible, and refreshes the user's
 * profiles.last_seen_at.
 */
export function UsageTracker() {
  const { session } = useAuth();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  // page_view + last_seen on navigation
  useEffect(() => {
    if (!session) return;
    void logEvent("page_view", location.pathname);
    db.from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.user.id)
      .then(() => {}, () => {});
  }, [location.pathname, session]);

  // heartbeat while the tab is visible
  useEffect(() => {
    if (!session) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") void logEvent("heartbeat", pathRef.current);
    }, HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [session]);

  return null;
}
