#!/usr/bin/env bash
#
# Doppler Editorial Pipeline — Health Check
# Checks: n8n workflows, Telegram bot, blog API, Supabase, VPS connectivity
#
# Usage: ./check-pipeline-status.sh
# Requires: N8N_API_KEY, TELEGRAM_BOT_TOKEN, BLOG_API_KEY env vars
#           (or reads from .env.pipeline in the same directory)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env if exists
if [[ -f "$SCRIPT_DIR/.env.pipeline" ]]; then
  set -a
  source "$SCRIPT_DIR/.env.pipeline"
  set +a
fi

# Defaults
N8N_HOST="${N8N_HOST:-72.61.87.54}"
N8N_PORT="${N8N_PORT:-5678}"
N8N_API_KEY="${N8N_API_KEY:?Missing N8N_API_KEY}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?Missing TELEGRAM_BOT_TOKEN}"
BLOG_API_URL="${BLOG_API_URL:-https://www.dopplervpn.org}"
BLOG_API_KEY="${BLOG_API_KEY:?Missing BLOG_API_KEY}"
SUPABASE_URL="${SUPABASE_URL:-https://fzlrhmjdjjzcgstaeblu.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?Missing SUPABASE_ANON_KEY}"

# Telegram channels (comma-separated: "chat_id:label")
TELEGRAM_CHANNELS="${TELEGRAM_CHANNELS:--1003716855563:EN,-1003525284412:RU}"

# Expected editorial workflow names (partial match)
EDITORIAL_WORKFLOWS="Topic Discovery,Content Generation,Image Pipeline,Publish"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass=0
fail=0
warn=0

check() {
  local label="$1" result="$2"
  if [[ "$result" == "ok" ]]; then
    echo -e "  ${GREEN}✓${NC} $label"
    pass=$((pass + 1))
  elif [[ "$result" == "warn" ]]; then
    echo -e "  ${YELLOW}⚠${NC} $label"
    warn=$((warn + 1))
  else
    echo -e "  ${RED}✗${NC} $label"
    fail=$((fail + 1))
  fi
}

echo -e "${BLUE}═══ Doppler Editorial Pipeline — Health Check ═══${NC}"
echo ""

# ── 1. n8n API ──
echo -e "${BLUE}[n8n Server]${NC}"
n8n_response=$(curl -s --max-time 10 -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "http://$N8N_HOST:$N8N_PORT/api/v1/workflows" 2>/dev/null || echo '{"error":true}')

if echo "$n8n_response" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if 'data' in d else 1)" 2>/dev/null; then
  check "n8n API reachable at $N8N_HOST:$N8N_PORT" "ok"

  # Check each editorial workflow
  IFS=',' read -ra WF_NAMES <<< "$EDITORIAL_WORKFLOWS"
  for wf_name in "${WF_NAMES[@]}"; do
    wf_name=$(echo "$wf_name" | xargs) # trim
    status=$(echo "$n8n_response" | python3 -c "
import json,sys
data = json.load(sys.stdin)['data']
for w in data:
    if '$wf_name' in w.get('name',''):
        print('active' if w.get('active') else 'inactive')
        sys.exit(0)
print('missing')
" 2>/dev/null)
    if [[ "$status" == "active" ]]; then
      check "Workflow '$wf_name' — active" "ok"
    elif [[ "$status" == "inactive" ]]; then
      check "Workflow '$wf_name' — INACTIVE" "warn"
    else
      check "Workflow '$wf_name' — NOT FOUND" "fail"
    fi
  done
else
  check "n8n API reachable at $N8N_HOST:$N8N_PORT" "fail"
fi

echo ""

# ── 2. Telegram Bot ──
echo -e "${BLUE}[Telegram Bot]${NC}"
bot_info=$(curl -s --max-time 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" 2>/dev/null || echo '{"ok":false}')
bot_ok=$(echo "$bot_info" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if d.get('ok') else 'no')" 2>/dev/null)

if [[ "$bot_ok" == "yes" ]]; then
  bot_name=$(echo "$bot_info" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['username'])" 2>/dev/null)
  check "Bot @$bot_name alive" "ok"
else
  check "Bot token valid" "fail"
fi

# Check channel access
IFS=',' read -ra CHANNELS <<< "$TELEGRAM_CHANNELS"
for ch in "${CHANNELS[@]}"; do
  chat_id="${ch%%:*}"
  label="${ch##*:}"
  chat_info=$(curl -s --max-time 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getChat?chat_id=$chat_id" 2>/dev/null || echo '{"ok":false}')
  chat_ok=$(echo "$chat_info" | python3 -c "import json,sys; print('yes' if json.load(sys.stdin).get('ok') else 'no')" 2>/dev/null)

  if [[ "$chat_ok" == "yes" ]]; then
    # Check if bot can actually post (getChatMember for the bot itself)
    bot_id=$(echo "$bot_info" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['id'])" 2>/dev/null)
    member=$(curl -s --max-time 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getChatMember?chat_id=$chat_id&user_id=$bot_id" 2>/dev/null || echo '{"ok":false}')
    member_status=$(echo "$member" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('result',{}).get('status','unknown') if d.get('ok') else 'error')" 2>/dev/null)

    if [[ "$member_status" == "administrator" ]]; then
      check "Channel $label ($chat_id) — bot is admin" "ok"
    elif [[ "$member_status" == "member" ]]; then
      check "Channel $label ($chat_id) — bot is member (not admin, can't post)" "warn"
    else
      check "Channel $label ($chat_id) — bot status: $member_status" "fail"
    fi
  else
    check "Channel $label ($chat_id) — not accessible" "fail"
  fi
done

echo ""

# ── 3. Blog API ──
echo -e "${BLUE}[Blog API]${NC}"
blog_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BLOG_API_URL/api/blog/status" 2>/dev/null || echo "000")
# The status endpoint may not exist, just check the domain responds
if [[ "$blog_status" == "000" ]]; then
  # Try just the homepage
  blog_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BLOG_API_URL" 2>/dev/null || echo "000")
fi

if [[ "$blog_status" =~ ^(200|301|302|308|401|404|405)$ ]]; then
  check "Blog API reachable at $BLOG_API_URL (HTTP $blog_status)" "ok"
elif [[ "$blog_status" == "000" ]]; then
  check "Blog API at $BLOG_API_URL — unreachable" "fail"
else
  check "Blog API at $BLOG_API_URL (HTTP $blog_status)" "warn"
fi

echo ""

# ── 4. Supabase ──
echo -e "${BLUE}[Supabase]${NC}"
supa_response=$(curl -s --max-time 10 \
  -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/blog_posts?select=id&limit=1" 2>/dev/null || echo "error")

if echo "$supa_response" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
  check "Supabase REST API reachable" "ok"

  # Count blog posts
  post_count=$(curl -s --max-time 10 \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Prefer: count=exact" \
    -H "Range: 0-0" \
    "$SUPABASE_URL/rest/v1/blog_posts?select=id" 2>/dev/null \
    -D - 2>/dev/null | grep -i 'content-range' | sed 's/.*\///' | tr -d '[:space:]' || echo "?")
  check "Blog posts in DB: $post_count" "ok"

  # Check storage bucket
  supa_storage=$(curl -s --max-time 10 \
    "$SUPABASE_URL/storage/v1/object/public/blog-images/" 2>/dev/null || echo "error")
  if [[ "$supa_storage" != "error" ]] && [[ "$supa_storage" != *"not found"* ]]; then
    check "Storage bucket 'blog-images' accessible" "ok"
  else
    check "Storage bucket 'blog-images'" "warn"
  fi
else
  check "Supabase REST API" "fail"
fi

echo ""

# ── 5. Recent executions ──
echo -e "${BLUE}[Recent Pipeline Activity]${NC}"
if [[ -n "${n8n_response:-}" ]] && echo "$n8n_response" | python3 -c "import json,sys; json.load(sys.stdin)['data']" 2>/dev/null >/dev/null; then
  recent=$(curl -s --max-time 10 -H "X-N8N-API-KEY: $N8N_API_KEY" \
    "http://$N8N_HOST:$N8N_PORT/api/v1/executions?limit=10" 2>/dev/null || echo '{"data":[]}')

  echo "$recent" | python3 -c "
import json, sys
data = json.load(sys.stdin).get('data', [])
success = sum(1 for e in data if e.get('status') == 'success')
errors = sum(1 for e in data if e.get('status') == 'error')
print(f'  Last 10 executions: {success} success, {errors} errors')
if errors > 0:
    for e in data:
        if e.get('status') == 'error':
            wfid = e.get('workflowId','?')
            stopped = e.get('stoppedAt','')[:19]
            print(f'    - Error in workflow {wfid} at {stopped}')
" 2>/dev/null
fi

echo ""

# ── Summary ──
echo -e "${BLUE}═══ Summary ═══${NC}"
total=$((pass + fail + warn))
echo -e "  ${GREEN}$pass passed${NC} / ${YELLOW}$warn warnings${NC} / ${RED}$fail failed${NC} (of $total checks)"

if [[ $fail -gt 0 ]]; then
  echo -e "  ${RED}Pipeline has issues — fix before relying on automated posts${NC}"
  exit 1
elif [[ $warn -gt 0 ]]; then
  echo -e "  ${YELLOW}Pipeline operational with warnings${NC}"
  exit 0
else
  echo -e "  ${GREEN}Pipeline fully operational${NC}"
  exit 0
fi
