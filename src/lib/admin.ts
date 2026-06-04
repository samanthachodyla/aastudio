// Admin + usage helpers. Reads rely on RLS: admins (profiles.is_admin) can
// select every user's rows; non-admins only their own.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const db = supabase as unknown as { from: (t: string) => any };

/** Whether the signed-in user is an admin (drives the Reports route + nav). */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    db.from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { is_admin?: boolean } | null }) => {
        if (active) {
          setIsAdmin(!!data?.is_admin);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  return { isAdmin, loading };
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  tier: string | null;
  last_seen_at: string | null;
  created_at: string | null;
}

export interface AdminDataset {
  profiles: ProfileRow[];
  usage: { user_id: string; event_type: string; occurred_at: string; path: string | null }[];
  artworks: { user_id: string; id: string; title: string; medium: string | null; year: number | null; price: number | null; status: string | null }[];
  invoices: { user_id: string; id: string; number: string | null; buyer_name: string | null; amount: number | null; status: string | null }[];
  contacts: { user_id: string; id: string; name: string; type: string | null; email: string | null }[];
  opportunities: { user_id: string; id: string }[];
}

/** Pull everything the Reports page needs in one shot (admin-scoped by RLS). */
export async function fetchAdminDataset(): Promise<AdminDataset> {
  const [profiles, usage, artworks, invoices, contacts, opportunities] = await Promise.all([
    db.from("profiles").select("id,email,full_name,is_admin,tier,last_seen_at,created_at"),
    db.from("usage_events").select("user_id,event_type,occurred_at,path"),
    db.from("artworks").select("user_id,id,title,medium,year,price,status"),
    db.from("invoices").select("user_id,id,number,buyer_name,amount,status"),
    db.from("contacts").select("user_id,id,name,type,email"),
    db.from("opportunities").select("user_id,id"),
  ]);

  const firstError =
    profiles.error || usage.error || artworks.error || invoices.error || contacts.error || opportunities.error;
  if (firstError) throw firstError;

  return {
    profiles: profiles.data ?? [],
    usage: usage.data ?? [],
    artworks: artworks.data ?? [],
    invoices: invoices.data ?? [],
    contacts: contacts.data ?? [],
    opportunities: opportunities.data ?? [],
  };
}
