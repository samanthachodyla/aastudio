# Edge functions — deploy & configuration

This project has four edge functions in this directory. Two were added for
receipt scanning and Studio Manager email and still need to be deployed +
configured:

- `receipt-scan` — reads an uploaded receipt image/PDF with Claude vision and
  returns expense fields. **Needs only deployment** (reuses the existing
  `ANTHROPIC_API_KEY` secret).
- `send-studio-manager-message` — emails Studio Manager submissions to
  `cara@allegoryartconsulting.com` via Resend. **Needs deployment + Resend setup.**

## 1. Deploy

**Easiest (no terminal):** open the project in Lovable and let it sync — it
deploys edge functions from this repo automatically.

**Supabase Dashboard:** Edge Functions → Deploy a new function → Via editor →
paste each `index.ts` → keep "Verify JWT" on → Deploy. Names must be exactly
`receipt-scan` and `send-studio-manager-message`.

**Supabase CLI (in a terminal, not the SQL editor):**

```bash
supabase functions deploy receipt-scan --project-ref czbzunpabgmwpldkrcex
supabase functions deploy send-studio-manager-message --project-ref czbzunpabgmwpldkrcex
```

## 2. Receipt scanner

Nothing else needed — once deployed it uses the existing `ANTHROPIC_API_KEY`.
JPG/PNG photos are the reliable path; PDF is best-effort.

## 3. Studio Manager email (Resend)

1. Create a free account at resend.com.
2. Domains → Add Domain → `allegoryartstudio.com` → add the DNS records Resend
   shows (at your domain registrar / host) → wait for **Verified**.
3. API Keys → Create → copy the `re_…` key.
4. Supabase → Edge Functions → Secrets → add `RESEND_API_KEY` = that key.
5. Only if you verified a different domain: add secret `STUDIO_MANAGER_FROM` =
   `Allegory Studio <studio-manager@yourverifieddomain.com>`.
6. Test from the app's Studio Manager form; the message should arrive at
   cara@allegoryartconsulting.com with the artist's address as reply-to.

Overridable secrets: `STUDIO_MANAGER_TO` (default cara@allegoryartconsulting.com),
`STUDIO_MANAGER_FROM` (default studio-manager@allegoryartstudio.com).

Until `RESEND_API_KEY` is set, the send function returns a clear
"email isn't configured yet" message rather than silently failing.
