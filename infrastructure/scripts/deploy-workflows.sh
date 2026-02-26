#!/usr/bin/env bash
#
# Deploy n8n workflows from git to a target n8n instance.
# Imports workflow JSONs, preserving webhook paths and connections.
#
# Usage:
#   ./deploy-workflows.sh                    # Deploy all editorial workflows
#   ./deploy-workflows.sh content-generation # Deploy a single workflow
#   ./deploy-workflows.sh --list             # List available workflows
#   ./deploy-workflows.sh --backup           # Backup current remote workflows
#
# Requires: N8N_API_KEY, N8N_HOST env vars (or .env.pipeline)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WF_DIR="$SCRIPT_DIR/../n8n-workflows"

if [[ -f "$SCRIPT_DIR/.env.pipeline" ]]; then
  set -a
  source "$SCRIPT_DIR/.env.pipeline"
  set +a
fi

N8N_HOST="${N8N_HOST:?Missing N8N_HOST}"
N8N_PORT="${N8N_PORT:-5678}"
N8N_API_KEY="${N8N_API_KEY:?Missing N8N_API_KEY}"
BASE_URL="http://$N8N_HOST:$N8N_PORT/api/v1"

# Editorial workflows to deploy (filename without .json -> expected n8n ID mapping)
declare -A EDITORIAL_WORKFLOWS=(
  ["topic-discovery"]="Topic Discovery"
  ["content-generation"]="Content Generation"
  ["image-pipeline"]="Image Pipeline"
  ["publish-distribute"]="Publish"
)

list_workflows() {
  echo "Available workflows in git:"
  for f in "$WF_DIR"/*.json; do
    name=$(basename "$f" .json)
    wf_name=$(python3 -c "import json; print(json.load(open('$f')).get('name','?'))" 2>/dev/null)
    wf_id=$(python3 -c "import json; print(json.load(open('$f')).get('id','?'))" 2>/dev/null)
    active=$(python3 -c "import json; print(json.load(open('$f')).get('active','?'))" 2>/dev/null)
    echo "  $name  →  $wf_name (id: $wf_id, active: $active)"
  done
}

backup_workflows() {
  local backup_dir="$WF_DIR/backups/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$backup_dir"

  echo "Backing up current remote workflows to $backup_dir..."
  local remote_wfs
  remote_wfs=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$BASE_URL/workflows" 2>/dev/null)

  echo "$remote_wfs" | python3 -c "
import json, sys
data = json.load(sys.stdin).get('data', [])
for w in data:
    print(w['id'])
" 2>/dev/null | while read -r wf_id; do
    curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$BASE_URL/workflows/$wf_id" \
      | python3 -m json.tool > "$backup_dir/$wf_id.json" 2>/dev/null
    wf_name=$(python3 -c "import json; print(json.load(open('$backup_dir/$wf_id.json')).get('name','?'))" 2>/dev/null)
    echo "  Backed up: $wf_name ($wf_id)"
  done

  echo "Backup complete: $backup_dir"
}

deploy_workflow() {
  local file="$1"
  local filename
  filename=$(basename "$file" .json)

  # Read the workflow JSON
  local wf_id wf_name
  wf_id=$(python3 -c "import json; print(json.load(open('$file')).get('id',''))" 2>/dev/null)
  wf_name=$(python3 -c "import json; print(json.load(open('$file')).get('name',''))" 2>/dev/null)

  if [[ -z "$wf_id" ]]; then
    echo "  ✗ $filename — no workflow ID found in JSON"
    return 1
  fi

  # Check if workflow exists on remote
  local remote_check
  remote_check=$(curl -s -o /dev/null -w "%{http_code}" -H "X-N8N-API-KEY: $N8N_API_KEY" "$BASE_URL/workflows/$wf_id" 2>/dev/null)

  # Build PUT payload (strip read-only fields)
  local payload
  payload=$(python3 -c "
import json
with open('$file') as f:
    wf = json.load(f)
print(json.dumps({
    'name': wf['name'],
    'nodes': wf['nodes'],
    'connections': wf['connections'],
    'settings': wf.get('settings', {}),
}))
" 2>/dev/null)

  if [[ "$remote_check" == "200" ]]; then
    # Update existing
    local result
    result=$(echo "$payload" | curl -s -X PUT \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      -H "Content-Type: application/json" \
      "$BASE_URL/workflows/$wf_id" \
      -d @- 2>/dev/null)

    local updated_at
    updated_at=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('updatedAt','?')[:19])" 2>/dev/null)
    echo "  ✓ Updated: $wf_name ($wf_id) at $updated_at"
  else
    # Create new — n8n import endpoint
    local result
    result=$(echo "$payload" | curl -s -X POST \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      -H "Content-Type: application/json" \
      "$BASE_URL/workflows" \
      -d @- 2>/dev/null)

    local new_id
    new_id=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','?'))" 2>/dev/null)
    echo "  ✓ Created: $wf_name (new id: $new_id)"
    echo "    ⚠ New workflow created with different ID — update references if needed"
  fi
}

# ── Main ──

case "${1:-all}" in
  --list|-l)
    list_workflows
    ;;
  --backup|-b)
    backup_workflows
    ;;
  all)
    echo "Deploying all editorial workflows..."
    for wf_file in "$WF_DIR"/topic-discovery.json "$WF_DIR"/content-generation.json "$WF_DIR"/image-pipeline.json "$WF_DIR"/publish-distribute.json; do
      if [[ -f "$wf_file" ]]; then
        deploy_workflow "$wf_file"
      fi
    done
    echo "Done."
    ;;
  *)
    target="$WF_DIR/$1.json"
    if [[ -f "$target" ]]; then
      echo "Deploying $1..."
      deploy_workflow "$target"
    else
      echo "Workflow not found: $target"
      echo "Available:"
      list_workflows
      exit 1
    fi
    ;;
esac
