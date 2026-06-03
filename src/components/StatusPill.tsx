import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  in_studio: "bg-surface text-foreground",
  on_consignment: "bg-foreground/5 text-foreground border-foreground/20",
  sold: "bg-foreground text-background",
  loaned: "bg-surface text-foreground",
  nfs: "bg-muted text-muted-foreground",

  draft: "bg-muted text-muted-foreground",
  sent: "bg-foreground/5 text-foreground border-foreground/20",
  paid: "bg-foreground text-background",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",

  active: "bg-foreground text-background",
  expired: "bg-muted text-muted-foreground",
  returned: "bg-surface text-foreground",

  researching: "bg-muted text-muted-foreground",
  applying: "bg-foreground/5 text-foreground border-foreground/20",
  submitted: "bg-foreground text-background",
  accepted: "bg-foreground text-background",
  declined: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",

  needs_reply: "bg-destructive/10 text-destructive border-destructive/30",
  awaiting_response: "bg-foreground/5 text-foreground border-foreground/20",
  fyi: "bg-muted text-muted-foreground",
  resolved: "bg-foreground text-background",

  idea: "bg-muted text-muted-foreground",
  in_progress: "bg-foreground/5 text-foreground border-foreground/20",
  scheduled: "bg-foreground/5 text-foreground border-foreground/20",
  posted: "bg-foreground text-background",
  ready: "bg-foreground/5 text-foreground border-foreground/20",

  new: "bg-muted text-muted-foreground",
  following_up: "bg-foreground/5 text-foreground border-foreground/20",
  negotiating: "bg-foreground/5 text-foreground border-foreground/20",
  won: "bg-foreground text-background",
  lost: "bg-muted text-muted-foreground",

  prospect: "bg-muted text-muted-foreground",
  warm: "bg-foreground/5 text-foreground border-foreground/20",
  vip: "bg-foreground text-background",
  dormant: "bg-muted text-muted-foreground italic",

  visit: "bg-surface text-foreground",
  call: "bg-surface text-foreground",
  meeting: "bg-surface text-foreground",
  exhibition: "bg-surface text-foreground",
  note: "bg-muted text-muted-foreground",
};

const labels: Record<string, string> = {
  in_studio: "In studio",
  on_consignment: "On consignment",
  sold: "Sold",
  loaned: "Loaned",
  nfs: "NFS",
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  active: "Active",
  expired: "Expired",
  returned: "Returned",
  researching: "Researching",
  applying: "Applying",
  submitted: "Submitted",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  open_call: "Open call",
  residency: "Residency",
  prize: "Prize",
  show: "Show",
  grant: "Grant",
  gallery: "Gallery",
  collector: "Collector",
  consultant: "Consultant",
  press: "Press",
  other: "Other",
  needs_reply: "Needs reply",
  awaiting_response: "Awaiting response",
  fyi: "FYI",
  resolved: "Resolved",
  idea: "Idea",
  in_progress: "In progress",
  scheduled: "Scheduled",
  posted: "Posted",
  ready: "Ready",
  instagram: "Instagram",
  newsletter: "Newsletter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  new: "New",
  following_up: "Following up",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
  prospect: "Prospect",
  warm: "Warm",
  vip: "VIP",
  dormant: "Dormant",
  curator: "Curator",
  peer: "Peer",
  visit: "Visit",
  call: "Call",
  meeting: "Meeting",
  exhibition: "Exhibition",
  note: "Note",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm border border-transparent font-medium",
        variants[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
