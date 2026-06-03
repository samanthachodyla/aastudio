#!/usr/bin/env bash
#
# Deploys the hardened edge functions + DB migration to the target Supabase
# project, and sets the Anthropic secret the functions need.
#
# Run this from a machine with normal network access (NOT the Claude sandbox,
# which blocks outbound traffic to Supabase).
#
# Prereqs:
#   - Supabase CLI installed   (npm i -g supabase  OR  brew install supabase/tap/supabase)
#   - SUPABASE_ACCESS_TOKEN     https://supabase.com/dashboard/account/tokens
#   - ANTHROPIC_API_KEY         the studio's Anthropic API key
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export ANTHROPIC_API_KEY=sk-ant-...
#   ./scripts/deploy-supabase.sh
#
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-czbzunpabgmwpldkrcex}"
FUNCTIONS=(marketing-intelligence opportunity-finder pricing-intelligence tailor-document)

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)}"
: "${ANTHROPIC_API_KEY:?Set ANTHROPIC_API_KEY to the studio's Anthropic key}"

command -v supabase >/dev/null 2>&1 || {
  echo "ERROR: supabase CLI not found. Install with:  npm i -g supabase" >&2
  exit 1
}

echo "==> Linking to project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> Setting ANTHROPIC_API_KEY secret"
supabase secrets set "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" --project-ref "$PROJECT_REF"

echo "==> Deploying edge functions (verify_jwt comes from supabase/config.toml = true)"
supabase functions deploy "${FUNCTIONS[@]}" --project-ref "$PROJECT_REF"

echo "==> Applying database migration(s)"
supabase db push

echo ""
echo "Done. All four functions now require an authenticated (non-anon) user;"
echo "anonymous calls and bare anon-key calls are rejected with 401."
