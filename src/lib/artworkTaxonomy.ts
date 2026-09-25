// Single source of truth for the two-axis artwork model:
//   status   (disposition) — Available / Sold / Donated / NFS
//   location (physical)    — In studio / On consignment / On loan / In gallery /
//                            In transit / In storage
// plus `locationDetail`, a free-text specific place shown for on_consignment and
// in_gallery. Everything (form, filters, exports, labels, migration) reads from
// here so the lists never drift apart again.
import type { Artwork, ArtworkStatus, ArtworkLocation } from "@/lib/types";

export const ARTWORK_STATUSES: { value: ArtworkStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "donated", label: "Donated" },
  { value: "nfs", label: "NFS" },
];

export const ARTWORK_LOCATIONS: { value: ArtworkLocation; label: string }[] = [
  { value: "in_studio", label: "In studio" },
  { value: "on_consignment", label: "On consignment" },
  { value: "on_loan", label: "On loan" },
  { value: "in_gallery", label: "In gallery" },
  { value: "in_transit", label: "In transit" },
  { value: "in_storage", label: "In storage" },
];

// Locations that get a free-text "specific place" box (gallery/consignor name).
export const LOCATIONS_WITH_DETAIL: ArtworkLocation[] = ["on_consignment", "in_gallery"];

const STATUS_VALUES = ARTWORK_STATUSES.map((s) => s.value) as string[];
const LOCATION_VALUES = ARTWORK_LOCATIONS.map((l) => l.value) as string[];
const STATUS_LABELS: Record<string, string> = Object.fromEntries(ARTWORK_STATUSES.map((s) => [s.value, s.label]));
const LOCATION_LABELS: Record<string, string> = Object.fromEntries(ARTWORK_LOCATIONS.map((l) => [l.value, l.label]));

export const statusLabel = (v?: string): string => (v ? STATUS_LABELS[v] ?? titleize(v) : "");
export const locationLabel = (v?: string): string => (v ? LOCATION_LABELS[v] ?? titleize(v) : "");
export const isValidStatus = (v?: string): v is ArtworkStatus => !!v && STATUS_VALUES.includes(v);
export const isValidLocation = (v?: string): v is ArtworkLocation => !!v && LOCATION_VALUES.includes(v);
export const locationTakesDetail = (v?: string): boolean => !!v && LOCATIONS_WITH_DETAIL.includes(v as ArtworkLocation);

function titleize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Legacy single-axis status → new (status, location). Used to migrate rows that
// pre-date the split (both in the DB and in any older export/import).
const LEGACY_STATUS_MAP: Record<string, { status: ArtworkStatus; location: ArtworkLocation }> = {
  in_studio: { status: "available", location: "in_studio" },
  on_consignment: { status: "available", location: "on_consignment" },
  loaned: { status: "available", location: "on_loan" },
  on_loan: { status: "available", location: "on_loan" },
  in_transit: { status: "available", location: "in_transit" },
  in_storage: { status: "available", location: "in_storage" },
  in_gallery: { status: "available", location: "in_gallery" },
  sold: { status: "sold", location: "in_studio" },
  donated: { status: "donated", location: "in_studio" },
  nfs: { status: "nfs", location: "in_studio" },
  available: { status: "available", location: "in_studio" },
};

/**
 * Coerce an artwork of any vintage into the two-axis shape. Rows created before
 * the split hold a single legacy `status` (e.g. "on_consignment") and a
 * free-text `location` (e.g. "Blue Door Gallery"); this maps the status onto the
 * new (status, location) pair and moves the old free-text location into
 * `locationDetail`. Rows already in the new shape pass through unchanged.
 */
export function normalizeArtwork(a: Artwork): Artwork {
  const rawStatus = String((a.status ?? "") as string);
  const rawLocation = String((a.location ?? "") as string);
  const hasNewStatus = isValidStatus(rawStatus);
  const hasNewLocation = isValidLocation(rawLocation);
  if (hasNewStatus && hasNewLocation) return a; // already new-shape (detail kept)

  const legacy = LEGACY_STATUS_MAP[rawStatus];
  const status: ArtworkStatus = hasNewStatus ? (rawStatus as ArtworkStatus) : legacy?.status ?? "available";
  const location: ArtworkLocation = hasNewLocation ? (rawLocation as ArtworkLocation) : legacy?.location ?? "in_studio";
  // An old free-text location (not one of the enums) becomes the specific detail.
  const detailFromLegacy = !hasNewLocation && rawLocation ? rawLocation : "";
  const locationDetail = a.locationDetail || detailFromLegacy || undefined;

  return { ...a, status, location, locationDetail };
}
