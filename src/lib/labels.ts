// Human-readable labels for app routes (used in admin Reports) and the list of
// features offered in the signup demographics survey.

export const PAGE_LABELS: Record<string, string> = {
  "/": "Today",
  "/inventory": "Inventory",
  "/sales": "Sales & Invoicing",
  "/exhibitions": "Exhibitions",
  "/contacts": "Contacts",
  "/studio-manager": "Studio Manager",
  "/profile-vault": "Profile Vault",
  "/communications": "Communications",
  "/marketing": "Marketing",
  "/pricing": "Pricing",
  "/settings": "Settings",
  "/reports": "Reports",
};

/** Pretty name for a path, falling back to the raw path. */
export function labelForPath(path: string | null | undefined): string {
  if (!path) return "—";
  return PAGE_LABELS[path] ?? path;
}

/** Choices for the "which feature do you hope to use most" survey question. */
export const FEATURE_OPTIONS = [
  "Inventory & cataloging",
  "Sales & invoicing",
  "Exhibitions & shows",
  "Contacts & collectors",
  "Studio Manager",
  "Profile Vault",
  "Communications Hub",
  "Marketing Assistant",
  "Pricing intelligence",
] as const;
