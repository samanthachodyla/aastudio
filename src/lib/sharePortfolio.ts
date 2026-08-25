// Shareable portfolio links — the artist publishes a selection of works as a
// public, read-only web page (/p/:slug) to send collectors, galleries, and
// stores. We store a self-contained SNAPSHOT (title, details, downscaled image)
// in the `shared_portfolios` table so the public page needs no auth and the
// artist controls exactly what's shown. Re-publishing makes a fresh link.
//
// Requires the `shared_portfolios` table (see the SQL in the Inventory share
// dialog / project notes) with public-read + owner-write RLS.
import { supabase } from "@/integrations/supabase/client";
import type { Artwork } from "@/lib/types";

export interface SharedWork {
  title: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  edition?: string;
  price?: number;       // omitted when prices are hidden
  statusLabel: string;
  location?: string;    // omitted when hidden
  imageUrl?: string;
}

export interface SharedPortfolioData {
  slug: string;
  title: string;
  artistName: string;
  contact?: string;
  showPrices: boolean;
  works: SharedWork[];
}

const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

function titleize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Unguessable, human-friendly slug (no ambiguous characters). */
function randomSlug(len = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[arr[i] % alphabet.length];
  return s;
}

/** Downscale a data-URL image so the shared snapshot stays light and the public
 *  page loads fast. Non-data-URL images (or any failure) pass through unchanged. */
export async function downscaleImage(src: string, max = 1600, quality = 0.82): Promise<string> {
  if (!src || !src.startsWith("data:image")) return src;
  try {
    const img = new Image();
    img.decoding = "async";
    const loaded = new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("image load failed"));
    });
    img.src = src;
    await loaded;
    const longest = Math.max(img.width, img.height);
    const scale = Math.min(1, max / longest);
    if (scale >= 1 && src.length < 300_000) return src; // already small enough
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return src;
  }
}

export interface CreateShareOptions {
  artworks: Artwork[];
  artistName: string;
  contact?: string;
  title: string;
  showPrices: boolean;
  showLocation: boolean;
  statusLabels: Record<string, string>;
}

export interface CreateShareResult {
  slug: string;
  url: string;
}

export async function createSharedPortfolio(opts: CreateShareOptions): Promise<CreateShareResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again to create a link.");

  const works: SharedWork[] = [];
  for (const a of opts.artworks) {
    works.push({
      title: a.title,
      year: a.year || undefined,
      medium: a.medium || undefined,
      dimensions: a.dimensions || undefined,
      edition: a.edition || undefined,
      price: opts.showPrices && typeof a.price === "number" && a.price > 0 ? a.price : undefined,
      statusLabel: opts.statusLabels[a.status] ?? titleize(String(a.status)),
      location: opts.showLocation && a.location ? a.location : undefined,
      imageUrl: a.imageUrl ? await downscaleImage(a.imageUrl) : undefined,
    });
  }

  const slug = randomSlug();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("shared_portfolios").insert({
    slug,
    owner_id: user.id,
    title: opts.title || "Available Works",
    artist_name: opts.artistName || null,
    contact: opts.contact || null,
    show_prices: opts.showPrices,
    works,
  });
  if (error) throw new Error(error.message || "Couldn't create the link.");
  return { slug, url: `${APP_ORIGIN}/p/${slug}` };
}

export async function loadSharedPortfolio(slug: string): Promise<SharedPortfolioData | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("shared_portfolios")
    .select("slug, title, artist_name, contact, show_prices, works")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    title: data.title || "Available Works",
    artistName: data.artist_name || "",
    contact: data.contact || undefined,
    showPrices: !!data.show_prices,
    works: Array.isArray(data.works) ? (data.works as SharedWork[]) : [],
  };
}
