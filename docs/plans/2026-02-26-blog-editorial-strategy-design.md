# Doppler Blog Editorial Strategy — Design Document

**Date:** 2026-02-26
**Status:** Approved
**Scope:** Blog content strategy, pipeline architecture, template system, image strategy

---

## 1. Brand Identity

**Voice:** Tech nerds who happen to run a VPN. Not a VPN blog — a tech blog by VPN people.

**Author:** "Doppler Team" on all posts. "Flora Bot" is retired.

**Tone spectrum:**
- Analysis & Quick-Take: Neutral-journalistic with measured expert opinion. Factual, accessible, not preachy.
- Internet Is Losing It & Hot Take Roundup: Casual, like a real person writing. Humor, internet slang, meme energy. Not AI-sounding.

**Privacy/VPN angle:** Woven in naturally when the topic calls for it. Never forced. If Claude drops a new feature — write about the feature, not about how VPNs protect your Claude conversations.

**Political sensitivity:**
- Factual everywhere
- More cautious language on Russia/China/Iran topics (report what happened, no inflammatory framing)
- More analytical on Western policy
- Funny posts can touch politics if the meme warrants it — just don't take sides

**Target competitors:** Tech news generalists (The Verge, TechCrunch, Ars Technica). The gap: they cover AI/policy/regulation but never connect it back to privacy, VPN, and what it means for the user's digital freedom. That's our lane.

**Monetization:** SEO authority for organic traffic. No aggressive product CTAs. Domain authority and brand awareness first, monetization later based on data.

**Audience:** Both EN and RU equally. Same stories, editorially consider both audiences when picking topics.

---

## 2. Content Templates

### Template A — Quick-Take (400-600 words)
- Breaking news coverage
- What happened (2-3 paragraphs)
- Embedded tweets/quotes showing real reactions from X
- "Why it matters" section when naturally relevant
- Source links
- Turnaround: fast, publish within hours of news breaking

### Template B — Analysis (800-1200 words)
- Deep dive on trending topic
- Context, history, implications
- Embedded reactions from X
- Use cases, comparisons, expert takes
- Privacy/VPN angle when topic connects organically
- Source links + related posts

### Template C — Internet Is Losing It (300-400 words)
- Viral moment / meme recap
- Best tweets and reactions (the funny ones)
- Casual tone, group chat energy
- Short, punchy, shareable
- Minimal structure — let the content breathe

### Template D — Hot Take Roundup (500-700 words)
- Curates 3-4 spicy debates from the week
- Opposing tweets per topic
- Brief witty commentary between each
- "What you missed in tech Twitter" vibe
- Bi-weekly rotation (Fridays or weekends)

---

## 3. Publishing Schedule

**Volume:** 3 posts/day (weekdays), 2 posts/day (weekends, lighter content)

**Daily slot structure:**
- Slot 1 (morning): Always a Quick-Take — catches overnight news
- Slot 2 (midday): Rotates between Analysis and Internet Is Losing It
- Slot 3 (afternoon): Rotates between Quick-Take, Internet Is Losing It, Hot Take Roundup

**Weekend:** Favor casual formats (Template C, D), reduce to 2 posts.

---

## 4. Topic Categories (9 in scope)

1. VPN/privacy regulation — new laws, court rulings, surveillance programs (EU, US, Russia, Iran, China)
2. AI product launches — Claude, ChatGPT, Gemini releases, features, pricing
3. AI regulation — EU AI Act, US executive orders, China AI rules
4. Big tech privacy moves — Apple/Google/Meta policy changes affecting user data
5. Trump/US political tech policy — tariffs, TikTok, Section 230
6. Censorship events — VPN blocks, social media shutdowns, internet cuts
7. Cybersecurity incidents — major breaches, zero-days, ransomware
8. Streaming/geo-unblocking — Netflix regions, sports, content access
9. Startup/VC ecosystem — funding, acquisitions in privacy/VPN/AI

---

## 5. Source Rotation & Topic Discovery

**Sources:**
- X/Twitter trending topics
- Google Trends
- Hacker News front page
- Reddit: r/technology, r/privacy, r/artificial, r/programming
- Tech RSS: The Verge, TechCrunch, Ars Technica, BleepingComputer
- Telegram RU tech channels
- Perplexity for deep research

**Rotation schedule (shuffled daily):**

| Time Slot | Primary Sources | Best For |
|-----------|----------------|----------|
| Morning | X/Twitter + Google Trends | Quick-Takes, what's hot right now |
| Midday | Reddit + Hacker News | Analysis, dev-focused takes |
| Afternoon | Tech RSS + Telegram RU channels | Quick-Takes, RU-relevant stories |
| Meme scan | X/Twitter + Reddit | Internet Is Losing It content |
| Weekly scan | All sources aggregated | Hot Take Roundup material |

Source combinations rotate — no fixed pattern. Pipeline shuffles which combo runs at which slot to get varied content.

**Duplicate prevention:** Filter against last 10 published titles before selecting a topic.

**X/Twitter integration:** No API. Perplexity research step finds trending tweets and reactions. Formatted as blockquote embeds with attribution links. Upgrade to X API ($100/mo) later if data shows engagement lift from richer tweet integration.

---

## 6. Image Strategy

### Hybrid approach with rule-based validation

**Decision tree:**
```
Article mentions specific company/product?
  YES -> Search press kit lookup table
    Found -> Use official image
    Not found -> AI-generate (Gemini) with company name in prompt
  NO (general topic) -> AI-generate via Gemini
```

**Rule-based validation (deterministic, no AI gate):**
- Article title contains "Apple" -> image must show Apple product/logo/event
- Article title contains "Claude" / "Anthropic" -> Anthropic press assets
- Article title contains "OpenAI" / "ChatGPT" -> OpenAI press assets
- Article title contains "Google" / "Gemini" -> Google press assets
- Company-to-press-kit mapping maintained as a lookup table in the n8n pipeline
- Mismatch = reject, fall back to AI generation with company context in prompt

**Meme posts (Template C):** Use screenshots/descriptions of the actual tweets/memes. No generic stock or AI art.

**Storage:** Supabase Storage `blog-images` bucket (existing).

---

## 7. Pipeline Architecture (n8n Workflows)

### Workflow 1 — Topic Discovery & Scheduling
- **Trigger:** Cron, 3x daily (morning, midday, afternoon)
- **Steps:**
  1. Pick source combo based on rotation schedule
  2. Perplexity searches trending topics from assigned sources
  3. Filter against last 10 published titles (deduplicate)
  4. Select topic + assign template type (A/B/C/D) based on content fit
  5. Pass to Workflow 2

### Workflow 2 — Content Generation
- **Trigger:** Receives topic + template type from Workflow 1
- **Steps:**
  1. Load template-specific system prompt (tone, structure, word count)
  2. Instruct AI to embed real tweets/quotes found during research as blockquotes
  3. For meme posts: focus on finding the viral source + best reactions
  4. Generate: title, content, excerpt, tags, meta_description
  5. Pass to Workflow 3

### Workflow 3 — Image Pipeline
- **Trigger:** Receives post data from Workflow 2
- **Steps:**
  1. Rule-based check: does title mention a known company?
  2. Yes -> search press kit lookup table
  3. No -> Gemini AI generation with topic-specific prompt
  4. Meme posts: describe viral image or skip (text-focused posts)
  5. Upload to Supabase Storage
  6. Return image URL

### Workflow 4 — Publish & Distribute
- **Trigger:** Content + image ready
- **Steps:**
  1. POST to `/api/blog/create` with all fields
  2. Auto-translation to 20 languages fires server-side
  3. Webhook callback to n8n on completion
  4. Post to Telegram: @dopplervpn (RU), @dopplervpnen (EN)
  5. Log metadata: template_type, source_combo, topic_category, publish_timestamp

### Workflow 5 — Service Monitor (existing, unchanged)

---

## 8. Translation Adjustments

**Two translation system prompts, selected by template type:**

**Formal prompt (Template A, B):** Current translation system prompt. Professional, preserves technical terms, clean markdown.

**Casual prompt (Template C, D):** New variant that:
- Preserves internet slang and meme references
- Keeps humor intact — don't formalize casual English into stiff translations
- Adapts memes culturally where possible (some memes don't translate — keep original reference with context)
- Still preserves markdown formatting and technical terms

Selection logic: `template_type` field determines which prompt to use during translation.

---

## 9. Database Changes

### New columns on `blog_posts` table

```sql
ALTER TABLE blog_posts
  ADD COLUMN template_type VARCHAR(20) DEFAULT 'quick-take'
    CHECK (template_type IN ('quick-take', 'analysis', 'meme', 'roundup')),
  ADD COLUMN source_combo TEXT,
  ADD COLUMN topic_category VARCHAR(50);
```

These enable performance tracking from day 1. Queryable dimensions:
- Which template type gets most views?
- Which source combo produces highest engagement?
- Which topic category performs best per locale?

### Author migration

```sql
UPDATE blog_posts SET author_name = 'Doppler Team' WHERE author_name = 'Flora Bot';
```

Update default in API create route: `author` default from `"Flora Bot"` to `"Doppler Team"`.

---

## 10. Data Collection & Future Optimization

**Track per post from day 1:**
- template_type, source_combo, topic_category
- publish_timestamp, locale
- Page views, time on page, bounce rate (via analytics)
- Telegram clicks per channel (EN vs RU)

**Optimization loop (after sufficient data):**
- Feed performance data back into strategy
- Adjust: template rotation weights, source combo frequency, topic category priority
- Identify which formats work best for which audience (EN vs RU)
- Potentially add/retire template types based on performance

---

## 11. Content Guardrails

**All posts:**
- No offensive content (common sense)
- Factual accuracy — cite sources
- No forced VPN/product pushing
- Tech terms stay in English across translations (VPN, DNS, IP, etc.)
- Brand names in English (Doppler VPN, Apple, Google, etc.)

**Political content:**
- Russia/China/Iran: report facts, cautious framing, no inflammatory language
- Western policy: analytical, can include measured opinion
- Meme posts: politics fair game if the meme warrants it, don't take sides

**Casual posts (Template C, D):**
- Anything goes as long as it's not offensive
- Tech humor, corporate cringe, political memes — all fair game
- Internet culture references encouraged

---

## Summary of Changes from Current State

| Area | Current | New |
|------|---------|-----|
| Posts/day | ~1 | 3 (weekdays), 2 (weekends) |
| Templates | 1 (generic) | 4 (Quick-Take, Analysis, Meme, Roundup) |
| Author | Flora Bot | Doppler Team |
| Tone | Professional only | Professional + casual (template-dependent) |
| VPN angle | Always present | Only when natural |
| Sources | Perplexity only | 7 sources in rotation |
| Images | Gemini AI only | Hybrid (press kits + AI) with rule-based validation |
| Translation prompts | 1 | 2 (formal + casual) |
| Tracking | None | template_type, source_combo, topic_category |
| X/Twitter | Not used | Embedded quotes via Perplexity research |
