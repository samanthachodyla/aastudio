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
  // Beta demographics survey (may be absent until the migration is applied).
  age?: number | null;
  zip_code?: string | null;
  desired_feature?: string | null;
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

  // Demographics live behind a later migration; fetch separately and tolerate
  // their absence so Reports keeps working before that migration is applied.
  const demo = await db
    .from("profiles")
    .select("id,age,zip_code,desired_feature")
    .then(
      (r: { data: ProfileRow[] | null; error: unknown }) => (r.error ? [] : r.data ?? []),
      () => [],
    );
  const demoById = new Map<string, ProfileRow>((demo as ProfileRow[]).map((d) => [d.id, d]));

  const mergedProfiles = (profiles.data ?? []).map((p: ProfileRow) => {
    const d = demoById.get(p.id);
    return d ? { ...p, age: d.age, zip_code: d.zip_code, desired_feature: d.desired_feature } : p;
  });

  return {
    profiles: mergedProfiles,
    usage: usage.data ?? [],
    artworks: artworks.data ?? [],
    invoices: invoices.data ?? [],
    contacts: contacts.data ?? [],
    opportunities: opportunities.data ?? [],
  };
}
