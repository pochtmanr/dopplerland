# Editorial Blog Pipeline — Setup Guide

Automated blog pipeline: AI-researched topics → content generation → image creation → blog publishing → Telegram posting → multi-language translation.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐     ┌────────────────────┐
│ Topic Discovery  │────▸│ Content Generation│────▸│ Image Pipeline │────▸│ Publish & Distribute│
│ (Perplexity AI)  │     │ (OpenAI gpt-5-mini)│    │ (Gemini AI)    │     │ Blog API + Telegram │
│ Cron 3x/day      │     │ Webhook            │     │ Webhook        │     │ Webhook + Translate  │
└─────────────────┘     └──────────────────┘     └────────────────┘     └────────────────────┘
```

**Runs on:** n8n (self-hosted on VPS) → calls your website's Blog API → posts to Telegram channels.

## Prerequisites

### 1. VPS with n8n

n8n must be running (Docker recommended). Required Docker env vars:

```bash
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
NODE_FUNCTION_ALLOW_BUILTIN=https,http,url,buffer,crypto
```

n8n Code nodes run in a sandbox. You CANNOT use `process.env`, `fetch`, or `URL` constructor. Instead:
- `$env.X` for environment variables
- `require('https')` for HTTP requests
- Pass hostname/path separately (no URL constructor)

### 2. Website with Blog API

Your website needs two API endpoints:

#### `POST /api/blog/create`

Creates a new blog post. Must accept JSON body:

```json
{
  "title": "string",
  "content": "markdown string",
  "excerpt": "string (max 200 chars)",
  "meta_description": "string (max 160 chars)",
  "featured_image": "URL string",
  "tags": ["string"],
  "template_type": "quick-take | analysis | meme | roundup",
  "source_combo": "string",
  "topic_category": "string",
  "author": "string",
  "auto_translate": false
}
```

Must return JSON:

```json
{
  "blog_id": "uuid",
  "slug": "url-slug",
  "english_url": "https://...",
  "all_urls": { "en": "https://...", "ru": "https://..." }
}
```

Authentication: Bearer token in `Authorization` header or custom header (e.g., `BLOG_API_KEY`).

#### `POST /api/blog/translate`

Triggers translation of a blog post to all configured languages. Accepts:

```json
{
  "post_id": "uuid"
}
```

Same auth as create endpoint. Can be fire-and-forget (returns immediately, translates async).

### 3. Supabase Project

Required tables:
- `blog_posts` — stores posts (id, slug, title, content, featured_image, template_type, source_combo, topic_category, created_at)
- `blog_post_translations` — stores per-locale translations (post_id, locale, title, content, slug, created_at)

Required storage bucket:
- `blog-images` — public bucket, allows PNG/JPEG/WebP/AVIF, max 5MB

### 4. Telegram Bot + Channels

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Create your Telegram channels
3. Add the bot as **admin** to each channel (must have "Post Messages" permission)
4. Get channel IDs: forward a message from the channel to [@userinfobot](https://t.me/userinfobot), or use the bot API's `getChat` method

### 5. API Keys Required

| Service | Key | Where to get |
|---------|-----|--------------|
| **Perplexity AI** | API key | https://perplexity.ai/settings/api |
| **OpenAI** | API key | https://platform.openai.com/api-keys |
| **Google Gemini** | API key | https://aistudio.google.com/apikey |
| **Supabase** | Service role key + anon key | Project Settings → API |
| **Telegram** | Bot token | @BotFather |
| **Blog API** | Your custom auth key | Your website config |
| **n8n** | API key | n8n Settings → API |

## Installation

### Step 1: Configure n8n Environment

Add these env vars to your n8n Docker container (or systemd service):

```bash
# Required API keys
PERPLEXITY_API_KEY=pplx-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # service_role key
TELEGRAM_BOT_TOKEN=123456:ABC...

# n8n sandbox config
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
NODE_FUNCTION_ALLOW_BUILTIN=https,http,url,buffer,crypto
```

### Step 2: Import Workflows

Option A — Use the deploy script:

```bash
cd infrastructure/scripts
cp .env.pipeline.example .env.pipeline
# Fill in your values
./deploy-workflows.sh
```

Option B — Manual import via n8n API:

```bash
KEY="your_n8n_api_key"
HOST="your-n8n-host:5678"

for f in infrastructure/n8n-workflows/{topic-discovery,content-generation,image-pipeline,publish-distribute}.json; do
  curl -s -X POST -H "X-N8N-API-KEY: $KEY" -H "Content-Type: application/json" \
    "http://$HOST/api/v1/workflows" -d @"$f"
done
```

Option C — Import via n8n UI: Settings → Import from File → select each JSON.

### Step 3: Update Workflow Configuration

After importing, update these hardcoded values in the workflows:

**Topic Discovery:**
- No changes needed (uses `$env` for all keys)

**Content Generation:**
- No changes needed (uses `$env.OPENAI_API_KEY`)

**Image Pipeline:**
- Update Supabase bucket name if different from `blog-images`
- Update `$env.GEMINI_API_KEY` reference if using different env var name

**Publish & Distribute:**
- `Publish to Blog API` node: Update URL to your blog's API endpoint
- `Publish to Blog API` node: Update Authorization header with your blog API key
- `Post to EN Channel` node: Update `chat_id` to your EN channel ID
- `Post to RU Channel` node: Update `chat_id` to your channel ID (or remove if single-language)
- `Trigger Translation` node: Update URL to your blog's translate endpoint
- `Format Telegram Messages` node: Update `baseUrl` to your domain

### Step 4: Activate Workflows

```bash
# Activate all 4 workflows
for ID in $(./deploy-workflows.sh --list | grep -oP 'id: \K[^ ]+'); do
  curl -s -X PATCH -H "X-N8N-API-KEY: $KEY" -H "Content-Type: application/json" \
    "http://$HOST/api/v1/workflows/$ID" -d '{"active": true}'
done
```

Or activate via n8n UI toggle.

### Step 5: Verify

```bash
cd infrastructure/scripts
./check-pipeline-status.sh
```

All checks should pass green.

## Customization for Other Projects

### Changing the Blog Domain

1. In **Publish & Distribute** workflow:
   - `Publish to Blog API` node → change URL
   - `Format Telegram Messages` node → change `baseUrl`
   - `Trigger Translation` node → change URL
2. In `check-pipeline-status.sh` → update `BLOG_API_URL`

### Changing Telegram Channels

1. In **Publish & Distribute** workflow:
   - `Post to EN Channel` node → change `chat_id`
   - `Post to RU Channel` node → change `chat_id` (or duplicate for more channels)
2. In `.env.pipeline` → update `TELEGRAM_CHANNELS`

### Changing Content Templates

The 4 templates (quick-take, analysis, meme, roundup) are defined in the **Content Generation** workflow's Code nodes. Each has:
- System prompt (writing style, structure, length)
- Template type identifier

To add a new template:
1. Add a new Code node with the prompt
2. Add a new branch in the Template Router switch node
3. Connect it to the same Generate Content → Parse Content → Add Source Links chain

### Changing the AI Model

- **Content generation:** `Generate Content` node → change `model` in JSON body (currently `gpt-5-mini`)
- **Research:** `Perplexity Research` node → change `model` (currently `sonar`)
- **Images:** Image Pipeline workflow → Gemini model in the generation node

### Changing the Schedule

Topic Discovery runs on a cron schedule (default: 8:00, 13:00, 18:00 UTC). Change in the Schedule trigger node.

### Single-Language Setup

If you don't need translation:
1. Set `auto_translate: false` in the Publish workflow (already default)
2. Remove or deactivate the `Trigger Translation` node
3. Remove the second Telegram channel posting node

## Workflow Files

| File | Workflow | Trigger |
|------|----------|---------|
| `topic-discovery.json` | Perplexity research + dedup + chain to other workflows | Cron schedule |
| `content-generation.json` | 4 template prompts → OpenAI → parse + source links | Webhook |
| `image-pipeline.json` | Company detection → Gemini AI image gen → Supabase upload | Webhook |
| `publish-distribute.json` | Blog API create → Telegram post → translation trigger | Webhook |

## Scripts

| Script | Purpose |
|--------|---------|
| `check-pipeline-status.sh` | Health check: n8n, Telegram, blog API, Supabase, recent executions |
| `deploy-workflows.sh` | Deploy/update workflows from git to n8n instance |
| `deploy-workflows.sh --backup` | Backup current remote workflows before deploying |
| `deploy-workflows.sh --list` | List available workflow files |

## Troubleshooting

### "Node 'X' hasn't been executed" error
The Content Generation workflow uses a switch to route to different prompt nodes. The Parse Content node safely handles this with try-catch — if you see this error, the Parse Content node needs updating.

### Telegram "chat not found"
Bot must be added as **admin** to the channel. Just being a member isn't enough for channels.

### Blog API timeout
The Publish workflow's `Publish to Blog API` node has a 60s timeout. If your blog API takes longer (e.g., due to slug generation or image processing), increase the timeout in the node's options.

### n8n Code node errors
Remember the sandbox restrictions:
- No `process.env` → use `$env.X`
- No `fetch` → use `require('https')`
- No `URL` constructor → parse manually
- No `setTimeout` or `setInterval`

### Content quality issues
If posts sound too AI-like, adjust the system prompts in the Content Generation workflow's Code nodes. Key rules:
- Topic-specific `##` headers, never generic ones
- No blockquote quotes — paraphrase inline
- No formulaic openers ("In a landmark move...")
- Bold key terms strategically
